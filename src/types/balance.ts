// 数据库表模型
export interface BalanceTable {
  id: string;
  user_id: string;
  refundable_amount: number;
  frozen_amount: number;
  cashback_amount: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionTable {
  id: string;
  user_id: string;
  amount: number;
  type: 'charge' | 'refund' | 'withdrawal';
  related_charge_id: string | null;
  reference_id: string | null;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
  updated_at: string;
}

// 领域模型
export interface Balance {
  id: string;
  userId: string;
  refundableAmount: number;
  frozenAmount: number;
  cashbackAmount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // 计算属性
  totalAmount: number; // 总余额
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'charge' | 'refund' | 'withdrawal';
  relatedChargeId: string | null;
  referenceId: string | null;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  
  // UI相关属性
  canRefund?: boolean;
  refundDisabledReason?: string;
}

// API请求/响应类型
export interface CreateTransactionRequest {
  amount: number;
  type: 'charge' | 'refund' | 'withdrawal';
  relatedChargeId?: string; // 退款时需要提供
}

export interface UpdateTransactionStatusRequest {
  status: 'succeeded' | 'failed';
  referenceId?: string;
}

export interface BalanceResponse {
  refundableAmount: number;
  frozenAmount: number;
  cashbackAmount: number;
  totalAmount: number;
}

// 类型转换函数
export function balanceTableToBalance(table: BalanceTable): Balance {
  return {
    id: table.id,
    userId: table.user_id,
    refundableAmount: table.refundable_amount,
    frozenAmount: table.frozen_amount,
    cashbackAmount: table.cashback_amount,
    createdAt: new Date(table.created_at),
    updatedAt: new Date(table.updated_at),
    totalAmount: table.refundable_amount + table.frozen_amount + table.cashback_amount
  };
}

export function transactionTableToTransaction(table: TransactionTable): Transaction {
  const now = new Date();
  const createdAt = new Date(table.created_at);
  const isWithinThreeDays = (now.getTime() - createdAt.getTime()) < (3 * 24 * 60 * 60 * 1000);
  
  const transaction: Transaction = {
    id: table.id,
    userId: table.user_id,
    amount: table.amount,
    type: table.type,
    relatedChargeId: table.related_charge_id,
    referenceId: table.reference_id,
    status: table.status,
    createdAt: createdAt,
    updatedAt: new Date(table.updated_at)
  };

  // 添加UI相关属性
  if (table.type === 'charge' && table.status === 'succeeded') {
    // 只有成功的充值交易才可能退款
    if (table.amount > 0) {
      // 检查是否已经有关联的成功退款
      transaction.canRefund = isWithinThreeDays;
      if (!isWithinThreeDays) {
        transaction.refundDisabledReason = '超过3天';
      }
    }
  }

  return transaction;
}