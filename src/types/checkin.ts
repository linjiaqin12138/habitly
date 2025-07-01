// 打卡模块类型定义
import { Question } from './questionnaire';

// 数据库模型类型
export interface CheckinProfileDB {
  id: string;
  user_id: string;
  questionnaire_id: string;
  title: string;
  description: string;
  frequency: CheckinFrequencyDB;
  reminder_time?: string;
  reward_rules: CheckinRewardRuleDB[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckinRecordDB {
  id: string;
  user_id: string;
  profile_id: string;
  questionnaire_response_id: string;
  checkin_date: string;
  score: number;
  reward_amount: number;
  is_remedial: boolean;
  created_at: string;
}

export interface CheckinFrequencyDB {
  type: 'daily' | 'weekly' | 'custom';
  weeklyDays?: number[];
  customDates?: string[];
}

export interface CheckinRewardRuleDB {
  threshold: number;
  amount: number;
}

// API模型类型
export interface CheckinProfile {
  id: string;
  userId: string;
  questionnaireId: string;
  title: string;
  description: string;
  frequency: CheckinFrequency;
  reminderTime?: string;
  rewardRules: CheckinRewardRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckinRecord {
  id: string;
  userId: string;
  profileId: string;
  questionnaireResponseId: string;
  checkinDate: string;
  score: number;
  rewardAmount: number;
  isRemedial: boolean;
  createdAt: Date;
}

export interface CheckinFrequency {
  type: 'daily' | 'weekly' | 'custom';
  weeklyDays?: number[];
  customDates?: string[];
}

export interface CheckinRewardRule {
  threshold: number;
  amount: number;
}

// 请求类型
export interface CheckinProfileCreateRequest {
  title: string;
  description: string;
  frequency: CheckinFrequency;
  reminderTime?: string;
  rewardRules: CheckinRewardRule[];
  questionnaire: {
    title: string;
    description: string;
    questions: Question[];
    totalScore: number;
  };
}

export interface CheckinProfileUpdateRequest {
  title?: string;
  description?: string;
  frequency?: CheckinFrequency;
  reminderTime?: string;
  rewardRules?: CheckinRewardRule[];
  questionnaire?: {
    title?: string;
    description?: string;
    questions?: Question[];
    totalScore?: number;
  };
}

export interface CheckinSubmitRequest {
  profileId: string;
  answers: Record<string, string | string[] | number>;
}

export interface CheckinRemedialRequest {
  profileId: string;
  answers: Record<string, string | string[] | number>;
  checkinDate: string;
}

// 响应类型
export interface CheckinRecordsResponse {
  records: CheckinRecord[];
  total: number;
}

export interface MissingDatesResponse {
  missingDates: string[];
}

// 类型转换函数
export function dbToApiProfile(db: CheckinProfileDB): CheckinProfile {
  return {
    id: db.id,
    userId: db.user_id,
    questionnaireId: db.questionnaire_id,
    title: db.title,
    description: db.description,
    frequency: db.frequency,
    reminderTime: db.reminder_time ? db.reminder_time.substring(0, 5) : undefined,
    rewardRules: db.reward_rules,
    isActive: db.is_active,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at)
  };
}

export function dbToApiRecord(db: CheckinRecordDB): CheckinRecord {
  return {
    id: db.id,
    userId: db.user_id,
    profileId: db.profile_id,
    questionnaireResponseId: db.questionnaire_response_id,
    checkinDate: db.checkin_date,
    score: db.score,
    rewardAmount: db.reward_amount,
    isRemedial: db.is_remedial,
    createdAt: new Date(db.created_at)
  };
}

export function apiToDbProfile(api: Partial<CheckinProfile>): Partial<CheckinProfileDB> {
  return {
    user_id: api.userId,
    questionnaire_id: api.questionnaireId,
    title: api.title,
    description: api.description,
    frequency: api.frequency,
    reminder_time: api.reminderTime,
    reward_rules: api.rewardRules,
    is_active: api.isActive
  };
}

export function apiToDbRecord(api: Partial<CheckinRecord>): Partial<CheckinRecordDB> {
  return {
    user_id: api.userId,
    profile_id: api.profileId,
    questionnaire_response_id: api.questionnaireResponseId,
    checkin_date: api.checkinDate,
    score: api.score,
    reward_amount: api.rewardAmount,
    is_remedial: api.isRemedial
  };
}

// 错误类型
export type CheckinErrorType = 
  | 'PROFILE_NOT_FOUND'
  | 'QUESTIONNAIRE_ERROR'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_CHECKIN_DATE'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'CONFLICT';