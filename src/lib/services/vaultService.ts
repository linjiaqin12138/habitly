import { createClient } from '@supabase/supabase-js';
import { Vault, VaultDb, VaultTransaction, VaultTransactionDb, vaultDbToModel, vaultTransactionDbToModel } from '@/types/vault';
import { Database } from '@/lib/supabase/types';

const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function getVaultByUserId(userId: string): Promise<Vault | null> {
  const { data, error } = await supabase
    .from<VaultDb>('vault')
    .select('*')
    .eq('user_id', userId)
    .single();
  console.log(data, error)
  if (error || !data) return null;
  return vaultDbToModel(data);
}

export async function setVaultAmount(userId: string, amount: number): Promise<{ vault: Vault; transaction: VaultTransaction } | null> {
  // 查询vault
  const { data: vaultDb, error: vaultErr } = await supabase
    .from<VaultDb>('vault')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (vaultErr || !vaultDb) return null;
  // 更新金额
  const { data: updated, error: updateErr } = await supabase
    .from<VaultDb>('vault')
    .update({ total_amount: amount, available_rewards: amount })
    .eq('id', vaultDb.id)
    .select()
    .single();
  if (updateErr || !updated) return null;
  // 新增一条adjust类型交易
  const { data: tx, error: txErr } = await supabase
    .from<VaultTransactionDb>('vault_transaction')
    .insert({
      user_id: userId,
      vault_id: vaultDb.id,
      type: 'adjust',
      amount,
      balance_after: amount,
      description: '设置小金库金额',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (txErr || !tx) return null;
  return { vault: vaultDbToModel(updated), transaction: vaultTransactionDbToModel(tx) };
}

export async function spendVault(userId: string, amount: number, description?: string): Promise<{ vault: Vault; transaction: VaultTransaction } | null | 'INSUFFICIENT_BALANCE'> {
  // 查询vault
  const { data: vaultDb, error: vaultErr } = await supabase
    .from<VaultDb>('vault')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (vaultErr || !vaultDb) return null;
  if (vaultDb.available_rewards < amount) return 'INSUFFICIENT_BALANCE';
  // 扣减余额
  const newBalance = vaultDb.available_rewards - amount;
  const { data: updated, error: updateErr } = await supabase
    .from<VaultDb>('vault')
    .update({ available_rewards: newBalance })
    .eq('id', vaultDb.id)
    .select()
    .single();
  if (updateErr || !updated) return null;
  // 新增一条spend类型交易
  const { data: tx, error: txErr } = await supabase
    .from<VaultTransactionDb>('vault_transaction')
    .insert({
      user_id: userId,
      vault_id: vaultDb.id,
      type: 'spend',
      amount,
      balance_after: newBalance,
      description: description || '消费奖励',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (txErr || !tx) return null;
  return { vault: vaultDbToModel(updated), transaction: vaultTransactionDbToModel(tx) };
}

export async function getVaultTransactions(userId: string, type?: 'adjust' | 'reward' | 'spend', limit = 50, offset = 0): Promise<{ transactions: VaultTransaction[]; total: number }> {
  let query = supabase
    .from<VaultTransactionDb>('vault_transaction')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (type) query = query.eq('type', type);
  const { data, error, count } = await query;
  return {
    transactions: (data || []).map(vaultTransactionDbToModel),
    total: count || 0,
  };
}
