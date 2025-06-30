import { Vault, VaultTransaction } from '@/types/vault';

// 获取小金库数据
export async function getVault(): Promise<{ vault: Vault }> {
  const response = await fetch('/api/vault');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取小金库失败');
  }
  return await response.json();
}

// 获取交易记录
export async function getVaultTransactions(limit: number = 50): Promise<{ transactions: VaultTransaction[] }> {
  const response = await fetch(`/api/vault/transactions?limit=${limit}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取交易记录失败');
  }
  return await response.json();
}

// 设置小金库金额
export async function setVaultAmount(amount: number): Promise<{ vault: Vault }> {
  const response = await fetch('/api/vault/amount', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '设置失败');
  }

  return await response.json();
}

// 消费奖励
export async function spendReward(amount: number, description?: string): Promise<{ transaction: VaultTransaction }> {
  const response = await fetch('/api/vault/spend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, description }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '消费失败');
  }

  return await response.json();
}