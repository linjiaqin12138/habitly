import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as checkinService from '@/lib/services/checkinService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { AppError, GeneralErrorCode, CheckinErrorCode } from '@/types/error';

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
    const { id } = context.params;
    
    const profile = await checkinService.getCheckinProfile(user.id, id);
    if (!profile) {
      throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, '打卡配置不存在');
    }

    return NextResponse.json({ profile });
  })
);

export const PUT = withErrorHandling(
  withAuth(async ({ user, req, context }) => {
    const { id } = context.params;
    const body = await req.json();
    
    const parse = UpdateCheckinProfileSchema.safeParse(body);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, `参数验证失败: ${parse.error.message} ${JSON.stringify(body, undefined, 2)}`);
    }

    try {
      const profile = await checkinService.updateCheckinProfile(user.id, id, parse.data);
      return NextResponse.json({ profile });
    } catch (error: any) {
      if (error.message.includes('不存在')) {
        throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, error.message);
      }
      if (error.message.includes('问卷')) {
        throw new AppError(CheckinErrorCode.QUESTIONNAIRE_ERROR, error.message);
      }
      throw new AppError(GeneralErrorCode.INTERNAL_ERROR, error.message);
    }
  })
);

export const DELETE = withErrorHandling(
  withAuth(async ({ user, context }) => {
    const { id } = context.params;
    
    try {
      await checkinService.deleteCheckinProfile(user.id, id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (error.message.includes('不存在')) {
        throw new AppError(CheckinErrorCode.PROFILE_NOT_FOUND, error.message);
      }
      throw new AppError(GeneralErrorCode.INTERNAL_ERROR, error.message);
    }
  })
);