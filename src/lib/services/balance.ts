// 余额管理服务
import { createClient } from '../supabase/client';
import { createAdminClient } from '../supabase/admin';
import {
  Balance,
  BalanceResponse,
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionStatusRequest,
  balanceTableToBalance,
  transactionTableToTransaction,
} from '@/types/balance';

// 客户端服务函数
// ===============

/**
 * 获取当前用户的余额信息
 */
export async function getUserBalance(): Promise<BalanceResponse | null> {
  const supabase = createClient();
  
  // 获取当前用户ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('balances')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (error || !data) return null;
  
  const balance = balanceTableToBalance(data);
  return {
    refundableAmount: balance.refundableAmount,
    frozenAmount: balance.frozenAmount,
    cashbackAmount: balance.cashbackAmount,
    totalAmount: balance.totalAmount
  };
}

/**
 * 获取当前用户的交易历史
 */
export async function getUserTransactions(page = 0, limit = 10): Promise<Transaction[]> {
  const supabase = createClient();
  
  // 获取当前用户ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*, related_charge:related_charge_id(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
    
  if (error || !data) return [];
  
  // 再查询与这些交易关联的退款
  const chargeIds = data
    .filter(t => t.type === 'charge')
    .map(t => t.id);
    
  let refunds: any[] = [];
  
  if (chargeIds.length > 0) {
    const { data: refundData } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'refund')
      .in('related_charge_id', chargeIds);
      
    if (refundData) {
      refunds = refundData;
    }
  }
  
  // 处理交易数据，添加退款信息
  return data.map(transaction => {
    const t = transactionTableToTransaction(transaction);
    
    // 如果是充值交易，检查是否有对应的退款
    if (t.type === 'charge') {
      const hasRefund = refunds.some(r => 
        r.related_charge_id === t.id && r.status === 'succeeded'
      );
      
      if (hasRefund) {
        t.canRefund = false;
        t.refundDisabledReason = '已退款';
      }
    }
    
    return t;
  });
}

/**
 * 创建充值交易
 */
export async function createChargeTransaction(amount: number): Promise<Transaction | null> {
  const supabase = createClient();
  
  // 获取当前用户ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: amount,
      type: 'charge',
      status: 'pending'
    })
    .select()
    .single();
    
  if (error || !data) return null;
  
  // 模拟支付成功
  // 在实际项目中，这里应该重定向到支付页面
  // 然后通过webhook等方式接收支付结果
  await handleTransactionSuccess(data.id, user.id, amount);
  
  return transactionTableToTransaction(data);
}

/**
 * 创建退款交易
 */
export async function createRefundTransaction(
  chargeId: string, 
  amount: number
): Promise<Transaction | null> {
  const supabase = createClient();
  
  // 获取当前用户ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // 先获取原充值交易
  const { data: chargeData } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', chargeId)
    .eq('user_id', user.id)
    .single();
    
  if (!chargeData) return null;
  
  // 创建退款交易
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: -Math.abs(amount), // 确保是负数
      type: 'refund',
      status: 'pending',
      related_charge_id: chargeId
    })
    .select()
    .single();
    
  if (error || !data) return null;
  
  // 模拟退款成功
  // 在实际项目中，这里应该调用支付系统的退款API
  await handleRefundSuccess(data.id, user.id, Math.abs(amount));
  
  return transactionTableToTransaction(data);
}

/**
 * 创建提现交易
 */
export async function createWithdrawalTransaction(amount: number): Promise<Transaction | null> {
  const supabase = createClient();
  
  // 获取当前用户ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // 获取余额
  const balance = await getUserBalance();
  if (!balance || balance.cashbackAmount < amount) {
    throw new Error('可提现金额不足');
  }
  
  // 创建提现交易
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: -Math.abs(amount), // 确保是负数
      type: 'withdrawal',
      status: 'pending'
    })
    .select()
    .single();
    
  if (error || !data) return null;
  
  // 模拟提现成功
  // 在实际项目中，这里应该调用支付系统的提现API
  await handleWithdrawalSuccess(data.id, user.id, Math.abs(amount));
  
  return transactionTableToTransaction(data);
}

// 服务端管理函数（通过server actions或API路由调用）
// =======================================

/**
 * 处理交易成功
 * 这应该是一个服务端函数，通过webhook或定时任务调用
 */
export async function handleTransactionSuccess(
  transactionId: string, 
  userId: string, 
  amount: number
): Promise<void> {
  const admin = createAdminClient();
  
  // 调用数据库函数处理充值成功
  await admin.rpc('handle_charge_success', {
    p_user_id: userId,
    p_transaction_id: transactionId,
    p_amount: amount
  });
}

/**
 * 处理退款成功
 */
export async function handleRefundSuccess(
  transactionId: string, 
  userId: string, 
  amount: number
): Promise<void> {
  const admin = createAdminClient();
  
  // 调用数据库函数处理退款成功
  await admin.rpc('handle_refund_success', {
    p_user_id: userId,
    p_transaction_id: transactionId,
    p_amount: amount
  });
}

/**
 * 处理提现成功
 */
export async function handleWithdrawalSuccess(
  transactionId: string, 
  userId: string, 
  amount: number
): Promise<void> {
  const admin = createAdminClient();
  
  // 调用数据库函数处理提现成功
  await admin.rpc('handle_withdraw_success', {
    p_user_id: userId,
    p_transaction_id: transactionId,
    p_amount: amount
  });
}

/**
 * 定时任务：冻结过期的可退余额
 * 应该通过定时任务或cron job调用
 */
export async function freezeExpiredRefundableBalance(): Promise<void> {
  const admin = createAdminClient();
  
  // 调用数据库函数冻结过期可退余额
  await admin.rpc('freeze_expired_refundable_balance');
}