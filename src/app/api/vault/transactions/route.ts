import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVaultTransactions } from '@/lib/services/vaultService';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';
import { withAuth } from '@/lib/utils/withAuth';
import { AppError } from '@/types/error';

const QuerySchema = z.object({
  type: z.enum(['adjust', 'reward', 'spend']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

export const GET = withErrorHandling(
    withAuth(async ({ user, req }) => {
        const url = new URL(req.url);
        const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
        if (!parse.success) {
            throw new AppError('INVALID_REQUEST', parse.error.message);
        }
        const { type, limit, offset } = parse.data;
        const result = await getVaultTransactions(user.id, type, limit, offset);
        return NextResponse.json(result);
    })
);
