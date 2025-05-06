// 数据库表模型
export interface BalanceTable {
  id: string
  user_id: string
  refundable_amount: number
  frozen_amount: number
  cashback_amount: number
  created_at: string
  updated_at: string
}

export interface TransactionTable {
  id: string
  user_id: string
  amount: number
  type: 'charge' | 'refund' | 'withdrawal'
  reference_id: string | null
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
  updated_at: string
}

// 领域模型
export interface Balance {
  id: string
  userId: string
  refundableAmount: number
  frozenAmount: number
  cashbackAmount: number
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'charge' | 'refund' | 'withdrawal'
  referenceId: string | null
  status: 'pending' | 'succeeded' | 'failed'
  createdAt: Date
  updatedAt: Date
}

// 类型转换函数
export function toBalance(table: BalanceTable): Balance {
  return {
    id: table.id,
    userId: table.user_id,
    refundableAmount: table.refundable_amount,
    frozenAmount: table.frozen_amount,
    cashbackAmount: table.cashback_amount,
    createdAt: new Date(table.created_at),
    updatedAt: new Date(table.updated_at)
  }
}

export function toTransaction(table: TransactionTable): Transaction {
  return {
    id: table.id,
    userId: table.user_id,
    amount: table.amount,
    type: table.type,
    referenceId: table.reference_id,
    status: table.status,
    createdAt: new Date(table.created_at),
    updatedAt: new Date(table.updated_at)
  }
}

// API请求/响应类型
export interface CreateTransactionRequest {
  amount: number
  type: 'charge' | 'refund' | 'withdrawal'
}

export interface BalanceResponse {
  refundableAmount: number
  frozenAmount: number
  cashbackAmount: number
  totalBalance: number
}