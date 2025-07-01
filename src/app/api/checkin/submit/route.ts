import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as checkinService from '@/lib/services/checkinService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { AppError, GeneralErrorCode } from '@/types/error';

const AnswerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
]);

const CheckinSubmitSchema = z.object({
  profileId: z.string().uuid(),
  answers: z.record(z.string(), AnswerValueSchema),
});

export const POST = withErrorHandling(
  withAuth(async ({ user, req }) => {
    const body = await req.json();
    const parse = CheckinSubmitSchema.safeParse(body);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, `参数验证失败: ${parse.error.message}`);
    }
    const record = await checkinService.submitCheckin(user.id, parse.data);
    return NextResponse.json({ record });
  })
);