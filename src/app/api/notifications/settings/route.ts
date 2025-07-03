import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/utils/withAuth'
import { withErrorHandling } from '@/lib/utils/withErrorHandling'
import { 
  getUserNotificationSettings,
  updateUserNotificationSettings
} from '@/lib/services/notification'
import { AppError } from '@/types/error'

// Zod schema 定义
const NotificationSettingsUpdateSchema = z.object({
  pushplusToken: z.string().max(500).nullable().optional(),
  pushplusEnabled: z.boolean().optional(),
})

/**
 * 获取用户通知设置
 */
export const GET = withErrorHandling(
  withAuth(async ({ user }) => {
    const settings = await getUserNotificationSettings(user.id)
    return NextResponse.json({ settings })
  })
)

/**
 * 更新用户通知设置
 */
export const PUT = withErrorHandling(
  withAuth(async ({ req, user }) => {
    const body = await req.json()
    const parse = NotificationSettingsUpdateSchema.safeParse(body)
    
    if (!parse.success) {
      throw new AppError('BAD_REQUEST', `参数验证失败: ${parse.error.message}`)
    }

    const settings = await updateUserNotificationSettings(user.id, parse.data)
    return NextResponse.json({ settings })
  })
)