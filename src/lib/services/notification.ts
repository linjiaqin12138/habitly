import { createClient } from '@/lib/supabase/server'
import { 
  UserNotificationSettingsDB, 
  NotificationLogsDB,
  NotificationSettings,
  NotificationConfigValidation,
  NotificationChannel,
  NotificationStatus,
  TokenStatus,
  PushPlusResponse,
  dbToNotificationSettings,
  NotificationSettingsUpdateRequest
} from '@/types/notification'
import { AppError } from '@/types/error'

/**
 * 发送通知
 * @param userId 用户ID
 * @param title 通知标题
 * @param content 通知内容
 * @throws Error 发送失败时抛出异常
 */
export async function sendNotification(
  userId: string,
  title: string,
  content: string
): Promise<void> {
  const supabase = await createClient()
  
  // 查询用户通知配置
  const { data: settings, error } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`查询用户通知配置失败: ${error.message}`)
  }

  if (!settings?.pushplus_enabled || !settings.pushplus_token) {
    // 记录跳过日志
    await logNotification(userId, 'pushplus', title, content, 'skipped', 0, '用户未启用通知')
    return
  }

  // 发送通知（带重试）
  await sendWithRetry(settings.pushplus_token, title, content, userId)
}

/**
 * 验证用户通知配置
 * @param userId 用户ID
 * @returns 配置验证结果
 */
export async function validateUserNotificationConfig(
  userId: string
): Promise<NotificationConfigValidation> {
  const supabase = await createClient()
  
  const { data: settings } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  const availableChannels: NotificationChannel[] = []
  const missingConfigs: string[] = []

  if (settings?.pushplus_enabled && settings.pushplus_token && settings.token_status === 'valid') {
    availableChannels.push(NotificationChannel.PUSHPLUS)
  } else if (!settings?.pushplus_token) {
    missingConfigs.push('PushPlus Token')
  } else if (settings.token_status !== 'valid') {
    missingConfigs.push('有效的PushPlus Token')
  }

  return {
    isValid: availableChannels.length > 0,
    availableChannels,
    missingConfigs
  }
}

/**
 * 测试PushPlus Token有效性
 * @param token PushPlus Token
 * @returns 是否有效
 */
export async function validatePushPlusToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('http://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        title: '配置验证',
        content: '您的PushPlus Token配置成功！',
        template: 'html'
      })
    })

    const result: PushPlusResponse = await response.json()
    return result.code === 200
  } catch (error) {
    console.error('验证PushPlus Token失败:', error)
    return false
  }
}

/**
 * 获取用户通知设置
 */
export async function getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  const supabase = await createClient()
  
  const { data: settingsData, error } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new AppError('INTERNAL_ERROR', '查询通知设置失败')
  }

  // 如果没有设置记录，创建默认设置
  if (!settingsData) {
    return await createDefaultNotificationSettings(userId)
  }

  return dbToNotificationSettings(settingsData as UserNotificationSettingsDB)
}

/**
 * 创建默认通知设置
 */
export async function createDefaultNotificationSettings(userId: string): Promise<NotificationSettings> {
  const supabase = await createClient()
  
  const { data: newSettings, error: insertError } = await supabase
    .from('user_notification_settings')
    .insert({
      user_id: userId,
      pushplus_token: null,
      pushplus_enabled: false,
      token_status: 'valid'
    })
    .select()
    .single()

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', '创建默认通知设置失败')
  }

  return dbToNotificationSettings(newSettings as UserNotificationSettingsDB)
}

/**
 * 更新用户通知设置
 */
export async function updateUserNotificationSettings(
  userId: string, 
  updateData: NotificationSettingsUpdateRequest
): Promise<NotificationSettings> {
  const supabase = await createClient()

  // 获取当前设置
  const { data: currentSettings } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  // 检查Token是否有变化，如果有变化则验证
  let tokenStatus = currentSettings?.token_status || 'valid'
  if (updateData.pushplusToken !== undefined && updateData.pushplusToken !== currentSettings?.pushplus_token) {
    if (updateData.pushplusToken === null) {
      tokenStatus = 'valid'
    } else {
      const isValid = await validatePushPlusToken(updateData.pushplusToken)
      if (!isValid) {
        throw new AppError('BAD_REQUEST', 'PushPlus Token无效，请检查Token是否正确')
      }
      tokenStatus = 'valid'
    }
  }

  // 准备更新数据
  const dbUpdateData: any = {
    updated_at: new Date().toISOString(),
    token_status: tokenStatus
  }

  if (updateData.pushplusToken !== undefined) {
    dbUpdateData.pushplus_token = updateData.pushplusToken
  }

  if (updateData.pushplusEnabled !== undefined) {
    dbUpdateData.pushplus_enabled = updateData.pushplusEnabled
  }

  // 执行更新
  const { data: updatedSettings, error } = await supabase
    .from('user_notification_settings')
    .update(dbUpdateData)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new AppError('INTERNAL_ERROR', '更新通知设置失败')
  }

  return dbToNotificationSettings(updatedSettings as UserNotificationSettingsDB)
}

// ==================== 私有函数 ====================

/**
 * 发送通知（带重试机制）
 */
async function sendWithRetry(
  token: string,
  title: string,
  content: string,
  userId: string,
  retryCount = 0
): Promise<void> {
  try {
    const response = await fetch('http://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        title,
        content,
        template: 'html'
      })
    })

    const result: PushPlusResponse = await response.json()
    
    if (result.code === 200) {
      await logNotification(userId, 'pushplus', title, content, 'success', retryCount, null, result)
      return
    } else if (result.code === 903) {
      // Token无效，更新状态
      await updateTokenStatus(userId, 'invalid')
      await logNotification(userId, 'pushplus', title, content, 'failed', retryCount, 'Token无效', result)
      throw new Error(`Token无效: ${result.msg}`)
    } else {
      throw new Error(`发送失败: ${result.msg}`)
    }
  } catch (error) {
    if (retryCount < 3 && shouldRetry(error as Error)) {
      await delay(Math.pow(2, retryCount) * 1000)
      return sendWithRetry(token, title, content, userId, retryCount + 1)
    } else {
      await logNotification(userId, 'pushplus', title, content, 'failed', retryCount, (error as Error).message)
      throw error
    }
  }
}

/**
 * 判断是否应该重试
 */
function shouldRetry(error: Error): boolean {
  // Token无效不重试，网络错误或服务器错误才重试
  return !error.message.includes('Token无效')
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 记录通知发送历史
 */
async function logNotification(
  userId: string,
  channel: string,
  title: string,
  content: string,
  status: string,
  retryCount: number,
  errorMessage?: string | null,
  responseData?: Record<string, any> | null
): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        channel,
        title,
        content,
        status,
        retry_count: retryCount,
        error_message: errorMessage,
        response_data: responseData
      })
  } catch (error) {
    console.error('记录通知历史失败:', error)
  }
}

/**
 * 更新Token状态
 */
async function updateTokenStatus(userId: string, status: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase
      .from('user_notification_settings')
      .update({ 
        token_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
  } catch (error) {
    console.error('更新Token状态失败:', error)
  }
}