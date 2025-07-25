import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as checkinService from '@/lib/services/checkinService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { AppError, GeneralErrorCode, CheckinErrorCode } from '@/types/error';

const GetMissingDatesSchema = z.object({
  profileId: z.string().uuid(),
  days: z.coerce.number().min(1).max(30).default(7),
});

export const GET = withErrorHandling(
  withAuth(async ({ user, req }) => {
    const { searchParams } = new URL(req.url);
    
    const queryParams = {
      profileId: searchParams.get('profileId'),
      days: searchParams.get('days'),
    };

    const parse = GetMissingDatesSchema.safeParse(queryParams);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, `参数验证失败: ${parse.error.message}`);
    }

    try {
      const result = await checkinService.getMissingDates(user.id, parse.data.profileId, parse.data.days);
      return NextResponse.json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      if (errorMessage.includes('不存在')) {
        throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, errorMessage);
      }
      throw new AppError(GeneralErrorCode.INTERNAL_ERROR, errorMessage);
    }
  })
);