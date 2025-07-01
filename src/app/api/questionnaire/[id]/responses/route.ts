import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getQuestionnaireResponses } from '@/lib/services/questionnaireService';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { withAuth } from '@/lib/utils/withAuth';
import { AppError } from '@/types/error';

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

export const GET = withErrorHandling(
  withAuth(async ({ user, req, context }) => {
    const { id: questionnaireId } = await context.params;
    const url = new URL(req.url);
    const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parse.success) {
      throw new AppError('VALIDATION_ERROR', parse.error.message);
    }
    
    const { limit, offset } = parse.data;
    const result = await getQuestionnaireResponses(user.id, questionnaireId, limit, offset);
    return NextResponse.json(result);
  })
);