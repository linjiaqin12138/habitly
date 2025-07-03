import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/utils/withAuth'
import { withErrorHandling } from '@/lib/utils/withErrorHandling'
import { validatePushPlusToken } from '@/lib/services/notification'

// Zod schema 定义
const TestNotificationSchema = z.object({
  pushplusToken: z.string().min(1, 'PushPlus Token不能为空')
})

/**
 * 发送测试通知
 */
export const POST = withErrorHandling(
  withAuth(async ({ req }) => {
    const body = await req.json()
    const parse = TestNotificationSchema.safeParse(body)
    
    if (!parse.success) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: parse.error.errors[0].message },
        { status: 400 }
      )
    }

    const { pushplusToken } = parse.data

    // 验证Token并发送测试通知
    const isValid = await validatePushPlusToken(pushplusToken)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'PushPlus Token无效，请检查Token是否正确' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: '测试通知发送成功' })
  })
)