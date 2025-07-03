import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/withAuth'
import { withErrorHandling } from '@/lib/utils/withErrorHandling'
import { validateUserNotificationConfig } from '@/lib/services/notification'

/**
 * 验证用户通知配置
 */
export const GET = withErrorHandling(
  withAuth(async ({ user }) => {
    const validation = await validateUserNotificationConfig(user.id)
    return NextResponse.json({ validation })
  })
)