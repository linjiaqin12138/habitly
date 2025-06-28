import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getQuestionnaireList, createQuestionnaire } from '@/lib/services/questionnaireService';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { withAuth } from '@/lib/utils/withAuth';
import { AppError, GeneralErrorCode } from '@/types/error';

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

const CreateQuestionnaireSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500),
  questions: z.array(QuestionSchema),
  totalScore: z.number().min(0),
});

export const GET = withErrorHandling(
  withAuth(async ({ user }) => {
    const questionnaires = await getQuestionnaireList(user.id);
    return NextResponse.json({ questionnaires });
  })
);

export const POST = withErrorHandling(
  withAuth(async ({ user, req }) => {
    const body = await req.json();
    const parse = CreateQuestionnaireSchema.safeParse(body);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, parse.error.message);
    }
    
    const questionnaire = await createQuestionnaire(user.id, parse.data);
    return NextResponse.json({ questionnaire });
  })
);