import { createAdminClient as createClient } from '@/lib/supabase/admin';
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

// ==================== 定时提醒功能 ====================

import { sendNotification } from './notification';

// 定时提醒任务变量
let reminderInterval: NodeJS.Timeout | null = null;

/**
 * 扫描并发送打卡提醒
 */
export async function scanAndSendCheckinReminders(): Promise<void> {
  try {
    logger.info('开始扫描打卡提醒配置');
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = getLocalDateString();
    
    // 计算时间窗口（前后15分钟）
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);
    const startTime = `${windowStart.getHours().toString().padStart(2, '0')}:${windowStart.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${windowEnd.getHours().toString().padStart(2, '0')}:${windowEnd.getMinutes().toString().padStart(2, '0')}`;
    
    logger.info(`当前时间: ${currentTime}, 扫描时间窗口: ${startTime} - ${endTime}`);
    
    const supabase = await createClient();
    
    // 查询符合提醒条件的打卡配置
    const { data: profiles, error } = await supabase
      .from('checkin_profiles')
      .select('*')
      .eq('is_active', true)
      .not('reminder_time', 'is', null)
      .gte('reminder_time', startTime)
      .lte('reminder_time', endTime);
    
    if (error) {
      logger.error('查询打卡配置失败:', error);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      logger.info('没有找到需要提醒的打卡配置');
      return;
    }
    
    logger.info(`找到 ${profiles.length} 个需要检查的打卡配置`);
    
    // 处理每个配置
    for (const profileData of profiles) {
      try {
        const profile = dbToApiProfile(profileData);
        await processCheckinReminder(profile, today);
      } catch (error) {
        logger.error(`处理打卡配置 ${profileData.id} 的提醒失败:`, error);
      }
    }
    
    logger.info('打卡提醒扫描完成');
  } catch (error) {
    logger.error('扫描打卡提醒失败:', error);
  }
}

/**
 * 处理单个打卡配置的提醒
 */
async function processCheckinReminder(profile: CheckinProfile, today: string): Promise<void> {
  logger.info(`处理打卡配置: ${profile.title} (${profile.id})`);
  
  // 1. 检查今天是否应该打卡
  if (!shouldCheckinOnDate(profile.frequency, new Date())) {
    logger.info(`今天不是打卡日期，跳过提醒`);
    return;
  }
  
  // 2. 检查用户今天是否已经打卡
  const existingRecord = await getCheckinRecord(profile.userId, profile.id, today);
  if (existingRecord) {
    logger.info(`用户今天已经打卡，跳过提醒`);
    return;
  }
  
  // 3. 检查今天是否已经发送过提醒
  const hasReminderSent = await hasReminderSentToday(profile.userId, profile.id, today);
  if (hasReminderSent) {
    logger.info(`今天已经发送过提醒，跳过`);
    return;
  }
  
  // 4. 发送提醒通知
  const title = '⏰ 打卡提醒';
  const content = `别忘了完成今天的【${profile.title}】打卡哦！`;
  
  try {
    await sendNotification(profile.userId, title, content);
    logger.info(`成功发送打卡提醒给用户 ${profile.userId}`);
  } catch (error) {
    logger.error(`发送打卡提醒失败:`, error);
    throw error;
  }
}

/**
 * 检查今天是否已经发送过提醒
 */
async function hasReminderSentToday(userId: string, profileId: string, today: string): Promise<boolean> {
  const supabase = await createClient();
  
  const startOfDay = `${today}T00:00:00Z`;
  const endOfDay = `${today}T23:59:59Z`;
  
  const { data, error } = await supabase
    .from('notification_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('title', '⏰ 打卡提醒')
    .like('content', `%【%${profileId}%】%`)
    .gte('sent_at', startOfDay)
    .lte('sent_at', endOfDay)
    .eq('status', 'success')
    .limit(1);
  
  if (error) {
    logger.error('查询提醒发送记录失败:', error);
    return false; // 查询失败时允许发送，避免遗漏提醒
  }
  
  return data && data.length > 0;
}

/**
 * 启动打卡提醒定时任务
 */
export function startCheckinReminderService(): void {
  if (reminderInterval) {
    logger.info('打卡提醒定时任务已经在运行');
    return;
  }
  
  logger.info('启动打卡提醒定时任务，每30分钟执行一次');
  
  // 立即执行一次
  scanAndSendCheckinReminders().catch(error => {
    logger.error('首次执行打卡提醒扫描失败:', error);
  });
  
  // 设置定时任务，每30分钟执行一次
  reminderInterval = setInterval(() => {
    scanAndSendCheckinReminders().catch(error => {
      logger.error('定时打卡提醒扫描失败:', error);
    });
  }, 30 * 60 * 1000); // 30分钟 = 30 * 60 * 1000 毫秒
}

/**
 * 停止打卡提醒定时任务
 */
export function stopCheckinReminderService(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    logger.info('打卡提醒定时任务已停止');
  }
}