import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    getQuestionnaireById,
    updateQuestionnaire,
    deleteQuestionnaire
} from '@/lib/services/questionnaireService';
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

const UpdateQuestionnaireSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    questions: z.array(QuestionSchema).optional(),
    totalScore: z.number().min(0).optional(),
});

export const GET = withErrorHandling(
    withAuth(async ({ user, context }) => {
        const id = context.params.id as string;
        const questionnaire = await getQuestionnaireById(user.id, id);
        if (!questionnaire) {
            throw new AppError(GeneralErrorCode.NOT_FOUND, '问卷不存在');
        }
        return NextResponse.json({ questionnaire });
    })
);

export const PUT = withErrorHandling(
    withAuth(async ({ user, req, context }) => {
        const id = context.params.id as string;
        const body = await req.json();
        const parse = UpdateQuestionnaireSchema.safeParse(body);
        if (!parse.success) {
            throw new AppError('VALIDATION_ERROR', parse.error.message);
        }

        const questionnaire = await updateQuestionnaire(user.id, id, parse.data);
        return NextResponse.json({ questionnaire });
    })
);

export const DELETE = withErrorHandling(
    withAuth(async ({ user, context }) => {
        const id = context.params.id as string;
        await deleteQuestionnaire(user.id, id);
        // 只回复一个200 OK，没有body
        return NextResponse.json(null, { status: 200 });
    })
);