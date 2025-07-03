// 消息通知模块类型定义

// ==================== 数据库模型类型 (snake_case) ====================

/** 用户通知设置表 - 数据库模型 */
export interface UserNotificationSettingsDB {
  id: string
  user_id: string
  pushplus_token: string | null
  pushplus_enabled: boolean
  token_status: 'valid' | 'invalid' | 'expired'
  created_at: string
  updated_at: string
}

/** 通知发送历史表 - 数据库模型 */
export interface NotificationLogsDB {
  id: string
  user_id: string
  channel: 'pushplus'
  title: string
  content: string
  status: 'success' | 'failed' | 'skipped'
  retry_count: number
  error_message: string | null
  sent_at: string
  response_data: Record<string, unknown> | null
}

// ==================== 业务模型类型 (camelCase) ====================

/** 用户通知设置 - 业务模型 */
export interface NotificationSettings {
  id: string
  userId: string
  pushplusToken: string | null
  pushplusEnabled: boolean
  tokenStatus: 'valid' | 'invalid' | 'expired'
  createdAt: string
  updatedAt: string
}

/** 通知发送历史 - 业务模型 */
export interface NotificationLog {
  id: string
  userId: string
  channel: 'pushplus'
  title: string
  content: string
  status: 'success' | 'failed' | 'skipped'
  retryCount: number
  errorMessage: string | null
  sentAt: string
  responseData: Record<string, unknown> | null
}

// ==================== 枚举类型 ====================

/** 通知渠道 */
export enum NotificationChannel {
  PUSHPLUS = 'pushplus'
}

/** 通知状态 */
export enum NotificationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/** Token状态 */
export enum TokenStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  EXPIRED = 'expired'
}

// ==================== API 请求/响应类型 ====================

/** 更新通知设置请求 */
export interface NotificationSettingsUpdateRequest {
  pushplusToken?: string | null
  pushplusEnabled?: boolean
}

/** 通知配置验证结果 */
export interface NotificationConfigValidation {
  isValid: boolean
  availableChannels: NotificationChannel[]
  missingConfigs: string[]
}

/** PushPlus API 响应 */
export interface PushPlusResponse {
  code: number
  msg: string
  data?: unknown
  [key: string]: unknown
}

// ==================== 类型转换函数 ====================

/** 数据库模型转业务模型 - 通知设置 */
export function dbToNotificationSettings(db: UserNotificationSettingsDB): NotificationSettings {
  return {
    id: db.id,
    userId: db.user_id,
    pushplusToken: db.pushplus_token,
    pushplusEnabled: db.pushplus_enabled,
    tokenStatus: db.token_status,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}

/** 业务模型转数据库模型 - 通知设置 */
export function notificationSettingsToDb(model: NotificationSettings): UserNotificationSettingsDB {
  return {
    id: model.id,
    user_id: model.userId,
    pushplus_token: model.pushplusToken,
    pushplus_enabled: model.pushplusEnabled,
    token_status: model.tokenStatus,
    created_at: model.createdAt,
    updated_at: model.updatedAt
  }
}

/** 数据库模型转业务模型 - 通知历史 */
export function dbToNotificationLog(db: NotificationLogsDB): NotificationLog {
  return {
    id: db.id,
    userId: db.user_id,
    channel: db.channel,
    title: db.title,
    content: db.content,
    status: db.status,
    retryCount: db.retry_count,
    errorMessage: db.error_message,
    sentAt: db.sent_at,
    responseData: db.response_data
  }
}

/** 业务模型转数据库模型 - 通知历史 */
export function notificationLogToDb(model: NotificationLog): NotificationLogsDB {
  return {
    id: model.id,
    user_id: model.userId,
    channel: model.channel,
    title: model.title,
    content: model.content,
    status: model.status,
    retry_count: model.retryCount,
    error_message: model.errorMessage,
    sent_at: model.sentAt,
    response_data: model.responseData
  }
}