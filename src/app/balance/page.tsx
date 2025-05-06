"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

// 导入余额管理服务
import { 
  getUserBalance, 
  getUserTransactions,
  createChargeTransaction,
  createRefundTransaction,
  createWithdrawalTransaction 
} from "@/lib/services/balance";
import { Transaction, BalanceResponse } from "@/types/balance";

export default function BalancePage() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // 加载用户余额和交易记录
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 获取用户余额
        const balanceData = await getUserBalance();
        setBalance(balanceData);

        // 获取交易记录
        const transactionsData = await getUserTransactions();
        setTransactions(transactionsData);
      } catch (error) {
        console.error("加载数据失败:", error);
        toast.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 计算可退款总额
  const totalRefundable = transactions
    .filter(t => t.canRefund)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // 处理充值
  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      toast.error("请输入有效的充值金额");
      return;
    }

    setProcessingAction(true);
    try {
      await createChargeTransaction(parseFloat(rechargeAmount));
      toast.success("充值成功!");
      setShowRechargeDialog(false);
      setRechargeAmount("");
      
      // 重新加载数据
      const balanceData = await getUserBalance();
      setBalance(balanceData);
      const transactionsData = await getUserTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error("充值失败:", error);
      toast.error("充值失败，请稍后重试");
    } finally {
      setProcessingAction(false);
    }
  };

  // 处理提现
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("请输入有效的提现金额");
      return;
    }

    if (!balance || balance.cashbackAmount < parseFloat(withdrawAmount)) {
      toast.error("可提现余额不足");
      return;
    }

    setProcessingAction(true);
    try {
      await createWithdrawalTransaction(parseFloat(withdrawAmount));
      toast.success("提现申请已提交!");
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      
      // 重新加载数据
      const balanceData = await getUserBalance();
      setBalance(balanceData);
      const transactionsData = await getUserTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error("提现失败:", error);
      toast.error("提现失败，请稍后重试");
    } finally {
      setProcessingAction(false);
    }
  };

  // 处理退款
  const handleRefund = async () => {
    if (!selectedTransaction) return;

    setProcessingAction(true);
    try {
      await createRefundTransaction(
        selectedTransaction.id, 
        Math.abs(selectedTransaction.amount)
      );
      toast.success("退款申请已提交!");
      setShowRefundDialog(false);
      
      // 重新加载数据
      const balanceData = await getUserBalance();
      setBalance(balanceData);
      const transactionsData = await getUserTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error("退款失败:", error);
      toast.error("退款失败，请稍后重试");
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 余额卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>当前余额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl font-bold text-primary">
                {loading ? "加载中..." : `¥${balance?.totalAmount || 0}`}
              </div>
              <div className="flex space-x-4">
                <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
                  <DialogTrigger asChild>
                    <Button>充值</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>充值金额</DialogTitle>
                      <DialogDescription>
                        请仔细阅读以下规则后再决定是否充值
                      </DialogDescription>
                    </DialogHeader>
                    <Alert variant="destructive" className="my-4">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertTitle>充值须知</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p>• 充值金额仅能通过完成打卡任务获得返现</p>
                        <p>• 充值后3天内可申请全额退款</p>
                        <p>• 超过3天后金额将锁定，只能通过打卡返现方式获得</p>
                        <p>• 建议您根据实际打卡计划合理充值</p>
                      </AlertDescription>
                    </Alert>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          金额
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          className="col-span-3"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          placeholder="请输入充值金额"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRechargeDialog(false)}>
                        取消
                      </Button>
                      <Button 
                        onClick={handleRecharge}
                        disabled={processingAction || !rechargeAmount}
                      >
                        {processingAction ? "处理中..." : "确认充值"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">提现</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>提现申请</DialogTitle>
                      <DialogDescription>
                        请输入要提现的金额，提现将在1-3个工作日内处理
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="withdraw-amount" className="text-right">
                          金额
                        </Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          className="col-span-3"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="请输入提现金额"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                        取消
                      </Button>
                      <Button 
                        onClick={handleWithdraw}
                        disabled={processingAction || !withdrawAmount}
                      >
                        {processingAction ? "处理中..." : "申请提现"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 余额统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>余额统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-muted/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  ¥{loading ? "..." : balance?.totalAmount || 0}
                </div>
                <div className="text-sm text-muted-foreground">当前余额</div>
              </div>
              <div className="text-center p-4 bg-muted/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ¥{loading ? "..." : balance?.cashbackAmount || 0}
                </div>
                <div className="text-sm text-muted-foreground">可提现金额</div>
              </div>
              <div className="text-center p-4 bg-muted/10 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  ¥{loading ? "..." : balance?.frozenAmount || 0}
                </div>
                <div className="text-sm text-muted-foreground">锁定金额</div>
              </div>
              <div className="text-center p-4 bg-muted/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ¥{loading ? "..." : balance?.refundableAmount || 0}
                </div>
                <div className="text-sm text-muted-foreground">可退余额</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易记录表格卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>交易记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Alert>
              <AlertTitle>可退款余额</AlertTitle>
              <AlertDescription>
                最近3天内的充值总额：¥{totalRefundable}
              </AlertDescription>
            </Alert>
          </div>
          
          {loading ? (
            <div className="text-center py-8">加载交易记录中...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无交易记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {transaction.type === 'charge' ? '充值' : 
                       transaction.type === 'refund' ? '退款' : 
                       transaction.type === 'withdrawal' ? '提现' : '未知'}
                    </TableCell>
                    <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                      {transaction.amount > 0 ? "+" : ""}{Math.abs(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <span className={
                        transaction.status === "succeeded" 
                          ? "text-green-600"
                          : transaction.status === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }>
                        {transaction.status === 'succeeded' ? '成功' : 
                         transaction.status === 'pending' ? '处理中' : 
                         transaction.status === 'failed' ? '失败' : 
                         transaction.status === 'refunded' ? '已退款' : '未知'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {transaction.type === 'charge' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!transaction.canRefund || processingAction}
                          onClick={() => {
                            if (transaction.canRefund) {
                              setSelectedTransaction(transaction);
                              setShowRefundDialog(true);
                            }
                          }}
                        >
                          {transaction.canRefund ? "退款" : (transaction.refundDisabledReason || "不可退款")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退款</DialogTitle>
            <DialogDescription>
              您确定要对此笔充值进行退款吗？
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">充值金额</span>
                  <span className="font-medium">¥{Math.abs(selectedTransaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">充值时间</span>
                  <span className="font-medium">{new Date(selectedTransaction.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <Alert variant="destructive" className="mt-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>退款说明</AlertTitle>
                <AlertDescription>
                  退款将原路返回到您的支付账户，预计1-3个工作日到账
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRefund}
              disabled={processingAction}
            >
              {processingAction ? "处理中..." : "确认退款"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}