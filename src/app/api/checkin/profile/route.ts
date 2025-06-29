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
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        score: z.number(),
      })
    )
    .optional(),
  maxScore: z.number().optional(),
});

const CheckinFrequencySchema = z.object({
  type: z.enum(['daily', 'weekly', 'custom']),
  weeklyDays: z.array(z.number().min(0).max(6)).optional(),
  customDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

const CheckinRewardRuleSchema = z.object({
  threshold: z.number().min(0).max(100),
  amount: z.number().min(0),
});

const CreateCheckinProfileSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  frequency: CheckinFrequencySchema,
  reminderTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  rewardRules: z.array(CheckinRewardRuleSchema),
  questionnaire: z.object({
    title: z.string().min(1),
    description: z.string(),
    questions: z.array(QuestionSchema),
    totalScore: z.number().min(1),
  }),
});

export const GET = withErrorHandling(
  withAuth(async ({ user }) => {
    const profiles = await checkinService.getCheckinProfiles(user.id);
    return NextResponse.json({ profiles });
  })
);

export const POST = withErrorHandling(
  withAuth(async ({ user, req }) => {
    const body = await req.json();
    const parse = CreateCheckinProfileSchema.safeParse(body);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, `参数验证失败: ${parse.error.message} ${body}`);
    }

    try {
      const profile = await checkinService.createCheckinProfile(user.id, parse.data);
      return NextResponse.json({ profile });
    } catch (error: any) {
      if (error.message.includes('问卷')) {
        throw new AppError(CheckinErrorCode.QUESTIONNAIRE_ERROR, error.message);
      }
      throw new AppError(GeneralErrorCode.INTERNAL_ERROR, error.message);
    }
  })
);