import { NextResponse } from 'next/server';
import { z } from 'zod';
import { submitQuestionnaireResponse } from '@/lib/services/questionnaireService';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { withAuth } from '@/lib/utils/withAuth';
import { AppError, GeneralErrorCode } from '@/types/error';

const AnswerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
]);

const SubmitResponseSchema = z.object({
  answers: z.record(z.string(), AnswerValueSchema),
});

export const POST = withErrorHandling(
  withAuth(async ({ user, req, context }) => {
    const questionnaireId = context.params.id as string;
    const body = await req.json();
    const parse = SubmitResponseSchema.safeParse(body);
    if (!parse.success) {
      throw new AppError(GeneralErrorCode.BAD_REQUEST, parse.error.message);
    }
    
    const response = await submitQuestionnaireResponse(user.id, questionnaireId, parse.data.answers);
    return NextResponse.json({ response });
  })
);