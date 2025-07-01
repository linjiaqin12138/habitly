import { NextResponse } from 'next/server';
import { z } from 'zod';
import { setVaultAmount } from '@/lib/services/vaultService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { AppError } from '@/types/error';

const AmountSchema = z.object({
  amount: z.number().min(1).max(10000),
});

export const PUT = withErrorHandling(
    withAuth(async ({ user, req }) => {
        const body = await req.json();
        const parse = AmountSchema.safeParse(body);
        if (!parse.success) {
            throw new AppError('INVALID_REQUEST', parse.error.message);
        }
        const result = await setVaultAmount(user.id, parse.data.amount);
        return NextResponse.json(result);
    })
);
