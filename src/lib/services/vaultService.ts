import { createClient } from '@/lib/supabase/server';
import { AppError, GeneralErrorCode } from '@/types/error';
import { Vault, VaultDb, VaultTransaction, VaultTransactionDb, vaultDbToModel, vaultTransactionDbToModel } from '@/types/vault';

export async function getVaultByUserId(userId: string): Promise<Vault> {
    const supabase = await createClient();
    let { data, error } = await supabase
        .from('vaults')
        .select('*')
        .eq('user_id', userId)
        .single<VaultDb>();

    if (error && error.code === 'PGRST116') {
        // 创建一条默认记录
        const { data: defaultVault, error: createError } = await supabase
            .from('vaults')
            .insert({
                user_id: userId,
                total_amount: 0,
                available_rewards: 0,
            })
            .select()
            .single<VaultDb>();
        error = createError
        data = defaultVault
    }
    if (error) {
        throw error
    }
    return vaultDbToModel(data!);
}

export async function setVaultAmount(userId: string, amount: number): Promise<{ vault: Vault; transaction: VaultTransaction }> {
    const supabase = await createClient();
    const vault = await getVaultByUserId(userId);

    const { data: updated, error: updateErr } = await supabase
        .from('vaults')
        .update({ total_amount: amount, available_rewards: vault.availableRewards })
        .eq('id', vault.id)
        .select()
        .single<VaultDb>();

    if (updateErr) {
        throw new AppError(GeneralErrorCode.INTERNAL_ERROR, '更新失败，请稍后重试');
    }

    const { data: tx, error: txErr } = await supabase
        .from('vault_transactions')
        .insert({
            user_id: userId,
            vault_id: vault.id,
            type: 'adjust',
            amount,
            balance_after: amount,
            description: '设置小金库金额',
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (txErr) {
        throw new AppError(GeneralErrorCode.INTERNAL_ERROR, '插入事务失败，请稍后重试');
    }

    return { vault: vaultDbToModel(updated), transaction: vaultTransactionDbToModel(tx) };
}

export async function spendVault(userId: string, amount: number, description?: string): Promise<{ vault: Vault; transaction: VaultTransaction }> {
    const supabase = await createClient();
    const vault = await getVaultByUserId(userId);
    if (vault.availableRewards < amount) {
        throw new AppError('INSUFFICIENT_BALANCE', '可用奖励余额不足');
    };
    // 扣减余额
    const newBalance = vault.availableRewards - amount;
    const { data: updated, error: updateErr } = await supabase
        .from('vaults')
        .update({ available_rewards: newBalance })
        .eq('id', vault.id)
        .select()
        .single<VaultDb>();
    
    if (updateErr) {
        throw updateErr;
    }

    const { data: tx, error: txErr } = await supabase
        .from('vault_transactions')
        .insert({
            user_id: userId,
            vault_id: vault.id,
            type: 'spend',
            amount,
            balance_after: newBalance,
            description: description || '消费奖励',
            created_at: new Date().toISOString(),
        })
        .select()
        .single<VaultTransactionDb>();
    
    if (txErr) {
        throw txErr;
    }

    return { vault: vaultDbToModel(updated), transaction: vaultTransactionDbToModel(tx) };
}

export async function getVaultTransactions(userId: string, type?: 'adjust' | 'reward' | 'spend', limit = 50, offset = 0): Promise<{ transactions: VaultTransaction[]; total: number }> {
    const supabase = await createClient();
    let query = supabase
        .from('vault_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (type) query = query.eq('type', type);
    const { data, error, count } = await query;

    if (error && error.code !== 'PGRST116') {
        throw error
    }

    return {
        transactions: (data || []).map(vaultTransactionDbToModel),
        total: count || 0,
    };
}

export async function addReward(userId: string, rewardAmount: number, description?: string): Promise<void> {
    const vault = await getVaultByUserId(userId);
    const supabase = await createClient();
    
    // 更新可支配奖励余额
    const { error } = await supabase
      .from('vaults')
      .update({
        total_amount: vault.totalAmount - rewardAmount,
        available_rewards: vault.availableRewards + rewardAmount 
      })
      .eq('id', vault.id);

    if (error) {
        throw error;
    }

    // 记录奖励交易
    const { error: txErr } = await supabase
      .from('vault_transactions')
      .insert({
        user_id: userId,
        vault_id: vault.id,
        type: 'reward',
        amount: rewardAmount,
        balance_after: vault.availableRewards + rewardAmount,
        description: description,
        created_at: new Date().toISOString(),
      });

    if (txErr) {
        throw txErr;
    }
}
