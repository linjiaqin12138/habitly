import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CheckinService } from '@/lib/services/checkinService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { AppError, GeneralErrorCode, CheckinErrorCode } from '@/types/error';

const checkinService = new CheckinService();

const AnswerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
]);

const CheckinRemedialSchema = z.object({
  profileId: z.string().uuid(),
  answers: z.record(z.string(), AnswerValueSchema),
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const POST = withErrorHandling(
  withAuth(async ({ user, req }) => {
    const body = await req.json();
    const parse = CheckinRemedialSchema.safeParse(body);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, `参数验证失败: ${parse.error.message}`);
    }

    try {
      const record = await checkinService.submitRemedialCheckin(user.id, parse.data);
      return NextResponse.json({ record });
    } catch (error: any) {
      if (error.message.includes('不存在')) {
        throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, error.message);
      }
      if (error.message.includes('已经有打卡记录')) {
        throw new AppError(CheckinErrorCode.ALREADY_CHECKED_IN, error.message);
      }
      if (error.message.includes('只能补救最近3天') || error.message.includes('不是打卡日期')) {
        throw new AppError(CheckinErrorCode.INVALID_CHECKIN_DATE, error.message);
      }
      if (error.message.includes('问卷')) {
        throw new AppError(CheckinErrorCode.QUESTIONNAIRE_ERROR, error.message);
      }
      throw new AppError(GeneralErrorCode.INTERNAL_ERROR, error.message);
    }
  })
);