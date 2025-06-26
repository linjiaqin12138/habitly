import { NextResponse } from 'next/server';
import { z } from 'zod';
import { spendVault } from '@/lib/services/vaultService';
import { AppError } from '@/types/error';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { withAuth } from '@/lib/utils/withAuth';

const SpendSchema = z.object({
  amount: z.number().min(0.01),
  description: z.string().max(200).optional(),
});

export const POST = withErrorHandling(
    withAuth(async ({ user, req }) => {
        const body = await req.json();
        const parse = SpendSchema.safeParse(body);
        if (!parse.success) {
            throw new AppError('INVALID_REQUEST', parse.error.message);
        }
        const result = await spendVault(user.id, parse.data.amount, parse.data.description);
        return NextResponse.json(result);
    }),
    {
        'INSUFFICIENT_BALANCE': 409
    }
);
