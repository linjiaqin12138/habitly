import { createClient } from '@/lib/supabase/server';
import {
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  submitQuestionnaireResponse
} from './questionnaireService';
import {
  addReward
} from './vaultService';
import {
  CheckinProfile,
  CheckinRecord,
  CheckinProfileCreateRequest,
  CheckinProfileUpdateRequest,
  CheckinSubmitRequest,
  CheckinRemedialRequest,
  CheckinRecordsResponse,
  MissingDatesResponse,
  CheckinFrequency,
  CheckinRewardRule,
  dbToApiProfile,
  dbToApiRecord,
  apiToDbProfile,
  apiToDbRecord
} from '../../types/checkin';
import { AppError, GeneralErrorCode } from '@/types/error';
import { getLogger } from '../logger';
import { getLocalDateString } from '../utils/dateUtils';

const logger = getLogger('checkinService');

// 获取打卡配置列表
export async function getCheckinProfiles(userId: string): Promise<CheckinProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkin_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`获取打卡配置失败: ${error.message}`);
  }

  return data.map(dbToApiProfile);
}

// 获取单个打卡配置
export async function getCheckinProfile(userId: string, id: string): Promise<CheckinProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkin_profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return dbToApiProfile(data);
}

// 创建打卡配置（同时创建问卷）
export async function createCheckinProfile(userId: string, request: CheckinProfileCreateRequest): Promise<CheckinProfile> {
  // 1. 创建问卷
  const questionnaire = await createQuestionnaire(userId, {
    title: request.questionnaire.title,
    description: request.questionnaire.description,
    questions: request.questionnaire.questions,
    totalScore: request.questionnaire.totalScore
  });

  // 2. 创建打卡配置
  const profileData = apiToDbProfile({
    userId,
    questionnaireId: questionnaire.id,
    title: request.title,
    description: request.description,
    frequency: request.frequency,
    reminderTime: request.reminderTime,
    rewardRules: request.rewardRules,
    isActive: true
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkin_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    // 回滚：删除已创建的问卷
    await deleteQuestionnaire(userId, questionnaire.id);
    throw new Error(`创建打卡配置失败: ${error.message}`);
  }

  return dbToApiProfile(data);
}

// 更新打卡配置（同时更新问卷）
export async function updateCheckinProfile(userId: string, id: string, request: CheckinProfileUpdateRequest): Promise<CheckinProfile> {
  const existingProfile = await getCheckinProfile(userId, id);
  if (!existingProfile) {
    throw new Error('打卡配置不存在');
  }

  // 1. 如果有问卷更新，先更新问卷
  if (request.questionnaire) {
    await updateQuestionnaire(userId, existingProfile.questionnaireId, {
      title: request.questionnaire.title,
      description: request.questionnaire.description,
      questions: request.questionnaire.questions,
      totalScore: request.questionnaire.totalScore
    });
  }

  // 2. 更新打卡配置
  const updateData = apiToDbProfile({
    title: request.title,
    description: request.description,
    frequency: request.frequency,
    reminderTime: request.reminderTime,
    rewardRules: request.rewardRules,
    isActive: request.isActive
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkin_profiles')
    .update({ ...updateData, updated_at: new Date() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`更新打卡配置失败: ${error.message}`);
  }

  return dbToApiProfile(data);
}

// 删除打卡配置（同时删除问卷和记录）
export async function deleteCheckinProfile(userId: string, id: string): Promise<void> {
  const existingProfile = await getCheckinProfile(userId, id);
  if (!existingProfile) {
    throw new Error('打卡配置不存在');
  }

  const supabase = await createClient();
  
  // 1. 删除打卡记录
  await supabase
    .from('checkin_records')
    .delete()
    .eq('user_id', userId)
    .eq('profile_id', id);

  // 2. 删除关联问卷（会级联删除问卷填写记录）
  await deleteQuestionnaire(userId, existingProfile.questionnaireId);

  // 3. 删除打卡配置
  const { error } = await supabase
    .from('checkin_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`删除打卡配置失败: ${error.message}`);
  }
}

// 提交打卡
export async function submitCheckin(userId: string, request: CheckinSubmitRequest): Promise<CheckinRecord> {
  const profile = await getCheckinProfile(userId, request.profileId);
  if (!profile) {
    throw new AppError(GeneralErrorCode.NOT_FOUND, '打卡配置不存在');
  }
  logger.trace('profile: ', profile);

  const today = getLocalDateString(); // 修复：使用本地日期

  // 验证是否应该在今天打卡
  if (!shouldCheckinOnDate(profile.frequency, new Date())) {
    throw new AppError(GeneralErrorCode.FORBIDDEN, '今天不是打卡日期');
  }

  // 检查今天是否已经打过卡
  const existingRecord = await getCheckinRecord(userId, request.profileId, today);
  if (existingRecord) {
    throw new AppError(GeneralErrorCode.FORBIDDEN, '今日已经打过卡了');
  }

  // 1. 提交问卷答案
  const response = await submitQuestionnaireResponse(
    userId,
    profile.questionnaireId,
    request.answers
  );

  // 2. 计算奖励金额
  const rewardAmount = calculateReward(response.score, profile.rewardRules);
  // 3. 发放奖励（调用小金库服务的addReward功能）
  if (rewardAmount > 0) {
    await addReward(userId, rewardAmount, `打卡奖励: ${profile.title}`);
  }

  // 4. 保存打卡记录
  const recordData = apiToDbRecord({
    userId,
    profileId: request.profileId,
    questionnaireResponseId: response.id,
    checkinDate: today,
    score: response.score,
    rewardAmount,
    isRemedial: false
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkin_records')
    .insert(recordData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return dbToApiRecord(data);
}

// 提交补救打卡
export async function submitRemedialCheckin(userId: string, request: CheckinRemedialRequest): Promise<CheckinRecord> {
  const profile = await getCheckinProfile(userId, request.profileId);
  if (!profile) {
    throw new Error('打卡配置不存在');
  }

  const checkinDate = new Date(request.checkinDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));

  // 只能补救最近3天的
  if (daysDiff > 3 || daysDiff < 1) {
    throw new Error('只能补救最近3天的缺卡');
  }

  // 验证补救日期是否应该打卡
  if (!shouldCheckinOnDate(profile.frequency, checkinDate)) {
    throw new Error('该日期不是打卡日期');
  }

  // 检查是否已经有该日期的打卡记录
  const existingRecord = await getCheckinRecord(userId, request.profileId, request.checkinDate);
  if (existingRecord) {
    throw new Error('该日期已经有打卡记录');
  }

  // 1. 提交问卷答案
  const response = await submitQuestionnaireResponse(
    userId,
    profile.questionnaireId,
    request.answers
  );

  // 2. 计算奖励金额（补救打卡奖励减半）
  const baseRewardAmount = calculateReward(response.score, profile.rewardRules);
  const rewardAmount = baseRewardAmount * 0.5;

  // 3. 发放奖励
  if (rewardAmount > 0) {
    await addReward(userId, rewardAmount, `补救打卡奖励: ${profile.title}`);
  }

  // 4. 保存打卡记录
  const recordData = apiToDbRecord({
    userId,
    profileId: request.profileId,
    questionnaireResponseId: response.id,
    checkinDate: request.checkinDate,
    score: response.score,
    rewardAmount,
    isRemedial: true
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkin_records')
    .insert(recordData)
    .select()
    .single();

  if (error) {
    throw new Error(`保存补救打卡记录失败: ${error.message}`);
  }

  return dbToApiRecord(data);
}

// 获取打卡记录
export async function getCheckinRecords(
  userId: string,
  options: {
    profileId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<CheckinRecordsResponse> {
  const supabase = await createClient();
  let query = supabase
    .from('checkin_records')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (options.profileId) {
    query = query.eq('profile_id', options.profileId);
  }

  if (options.startDate) {
    query = query.gte('checkin_date', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('checkin_date', options.endDate);
  }

  query = query
    .order('checkin_date', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`获取打卡记录失败: ${error.message}`);
  }

  return {
    records: data.map(dbToApiRecord),
    total: count || 0
  };
}

// 获取缺卡日期
export async function getMissingDates(userId: string, profileId: string, days: number = 7): Promise<MissingDatesResponse> {
  const profile = await getCheckinProfile(userId, profileId);
  if (!profile) {
    throw new Error('打卡配置不存在');
  }

  const today = new Date();
  const missingDates: string[] = [];

  // 只检查最近3天（补救限制）
  const maxDays = Math.min(days, 3);

  for (let i = 1; i <= maxDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 检查该日期是否应该打卡
    if (shouldCheckinOnDate(profile.frequency, date)) {
      const dateStr = getLocalDateString(date); // 修复：使用本地日期
      
      // 检查是否已经有打卡记录
      const existingRecord = await getCheckinRecord(userId, profileId, dateStr);
      if (!existingRecord) {
        missingDates.push(dateStr);
      }
    }
  }

  return { missingDates };
}

// 私有函数：计算奖励金额
function calculateReward(score: number, rules: CheckinRewardRule[]): number {
  // 按阈值从高到低排序
  const sortedRules = [...rules].sort((a, b) => b.threshold - a.threshold);
  
  for (const rule of sortedRules) {
    if (score >= rule.threshold) {
      return rule.amount;
    }
  }
  
  return 0;
}

// 私有函数：判断指定日期是否应该打卡
function shouldCheckinOnDate(frequency: CheckinFrequency, date: Date): boolean {
  switch (frequency.type) {
    case 'daily':
      return true;
      
    case 'weekly':
      const dayOfWeek = date.getDay();
      return frequency.weeklyDays?.includes(dayOfWeek) || false;
      
    case 'custom':
      const dateStr = getLocalDateString(date); // 修复：使用本地日期
      return frequency.customDates?.includes(dateStr) || false;
      
    default:
      return false;
  }
}

// 私有函数：获取指定日期的打卡记录
async function getCheckinRecord(userId: string, profileId: string, date: string): Promise<CheckinRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkin_records')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('checkin_date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`查询打卡记录失败: ${error.message}`);
  }

  return dbToApiRecord(data);
}