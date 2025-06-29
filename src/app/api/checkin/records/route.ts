import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as checkinService from '@/lib/services/checkinService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { AppError, GeneralErrorCode } from '@/types/error';

const GetRecordsSchema = z.object({
  profileId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const GET = withErrorHandling(
  withAuth(async ({ user, req }) => {
    const { searchParams } = new URL(req.url);
    
    const queryParams = {
      profileId: searchParams.get('profileId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };

    const parse = GetRecordsSchema.safeParse(queryParams);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, `参数验证失败: ${parse.error.message}`);
    }

    const result = await checkinService.getCheckinRecords(user.id, parse.data);
    return NextResponse.json(result);
  })
);