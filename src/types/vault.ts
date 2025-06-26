// 小金库领域模型与数据库模型定义

// 数据库模型（下划线风格）
export interface VaultDb {
  id: string;
  user_id: string;
  total_amount: number;
  available_rewards: number;
  created_at: string;
  updated_at: string;
}

export interface VaultTransactionDb {
  id: string;
  user_id: string;
  vault_id: string;
  type: 'adjust' | 'reward' | 'spend';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

// 代码模型（驼峰风格）
export interface Vault {
  id: string;
  userId: string;
  totalAmount: number;
  availableRewards: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultTransaction {
  id: string;
  userId: string;
  vaultId: string;
  type: 'adjust' | 'reward' | 'spend';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

// 类型转换函数
export function vaultDbToModel(db: VaultDb): Vault {
  return {
    id: db.id,
    userId: db.user_id,
    totalAmount: db.total_amount,
    availableRewards: db.available_rewards,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function vaultTransactionDbToModel(db: VaultTransactionDb): VaultTransaction {
  return {
    id: db.id,
    userId: db.user_id,
    vaultId: db.vault_id,
    type: db.type,
    amount: db.amount,
    balanceAfter: db.balance_after,
    description: db.description,
    createdAt: db.created_at,
  };
}
