import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as checkinService from '@/lib/services/checkinService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { AppError, GeneralErrorCode, CheckinErrorCode } from '@/types/error';
import { getLogger } from '@/lib/logger';

const logger = getLogger('api.checkin.profile');

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['single', 'multiple', 'text', 'score']),
  title: z.string(),
  required: z.boolean(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    score: z.number(),
  })).optional(),
  maxScore: z.number().optional(),
});

const CheckinFrequencySchema = z.object({
  type: z.enum(['daily', 'weekly', 'custom']),
  weeklyDays: z.array(z.number().min(0).max(6)).optional(),
  customDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

const CheckinRewardRuleSchema = z.object({
  threshold: z.number().min(0).max(100),
  amount: z.number().min(0),
});

const UpdateCheckinProfileSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  frequency: CheckinFrequencySchema.optional(),
  reminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  rewardRules: z.array(CheckinRewardRuleSchema).optional(),
  questionnaire: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    questions: z.array(QuestionSchema).optional(),
    totalScore: z.number().min(1).optional(),
  }).optional(),
});

export const GET = withErrorHandling(
  withAuth(async ({ user, context }) => {
    const { id } = await context.params;
    
    const profile = await checkinService.getCheckinProfile(user.id, id);
    if (!profile) {
      throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, '打卡配置不存在');
    }

    return NextResponse.json({ profile });
  })
);

export const PUT = withErrorHandling(
  withAuth(async ({ user, req, context }) => {
    const { id } = await context.params;
    const body = await req.json();
    
    const parse = UpdateCheckinProfileSchema.safeParse(body);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, `参数验证失败: ${parse.error.message} ${JSON.stringify(body, undefined, 2)}`);
    }

    try {
      const profile = await checkinService.updateCheckinProfile(user.id, id, parse.data);
      return NextResponse.json({ profile });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      if (errorMessage.includes('不存在')) {
        throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, errorMessage);
      }
      if (errorMessage.includes('问卷')) {
        throw new AppError(CheckinErrorCode.QUESTIONNAIRE_ERROR, errorMessage);
      }
      throw new AppError(GeneralErrorCode.INTERNAL_ERROR, errorMessage);
    }
  })
);

export const DELETE = withErrorHandling(
  withAuth(async ({ user, context }) => {
    const { id } = await context.params;
    
    try {
      await checkinService.deleteCheckinProfile(user.id, id);
      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      if (errorMessage.includes('不存在')) {
        throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, errorMessage);
      }
      throw new AppError(GeneralErrorCode.INTERNAL_ERROR, errorMessage);
    }
  })
);