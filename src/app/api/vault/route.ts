import { NextResponse } from 'next/server';
import { getVaultByUserId } from '@/lib/services/vaultService';
import { withAuth } from '@/lib/utils/withAuth';
import { withErrorHandling } from '@/lib/utils/withErrorHandling';

export const GET = withErrorHandling(
    withAuth(async ({ user }) => {
        return NextResponse.json({ vault: await getVaultByUserId(user.id)  });
    })
);
