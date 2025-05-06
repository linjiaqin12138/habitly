"use client";

import { useState } from "react";
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

// 模拟交易记录数据
const transactions = [
  {
    id: 1,
    type: "充值",
    amount: 100,
    status: "成功",
    date: "2024-05-05 10:30:00",
    canRefund: true,
  },
  {
    id: 2,
    type: "退款",
    amount: -80,
    status: "成功",
    date: "2024-05-05 09:30:00",
  },
  {
    id: 3,
    type: "充值",
    amount: 50,
    status: "成功",
    date: "2024-05-04 15:20:00",
    canRefund: true,
  },
  {
    id: 4,
    type: "提现",
    amount: -100,
    status: "成功",
    date: "2024-05-03 16:45:00",
  },
  {
    id: 5,
    type: "充值",
    amount: 80,
    status: "已退款",
    date: "2024-05-04 12:00:00",
    canRefund: false,
    refundDisabledReason: "已退款",
  },
  {
    id: 6,
    type: "充值",
    amount: 200,
    status: "成功",
    date: "2024-05-01 09:15:00",
    canRefund: false,
    refundDisabledReason: "超过3天",
  },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function BalanceDemo() {
  const [currentBalance] = useState(240);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  // 计算可退款总额
  const totalRefundable = transactions
    .filter(t => t.canRefund)
    .reduce((sum, t) => sum + t.amount, 0);

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
              <div className="text-4xl font-bold text-primary">¥{currentBalance}</div>
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
                      <Button onClick={() => setShowRechargeDialog(false)}>
                        确认充值
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
                      <Button onClick={() => setShowWithdrawDialog(false)}>
                        申请提现
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
                <div className="text-2xl font-bold text-primary">¥240</div>
                <div className="text-sm text-muted-foreground">当前余额</div>
              </div>
              <div className="text-center p-4 bg-muted/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">¥180</div>
                <div className="text-sm text-muted-foreground">可提现金额</div>
              </div>
              <div className="text-center p-4 bg-muted/10 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">¥60</div>
                <div className="text-sm text-muted-foreground">锁定金额</div>
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
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                  </TableCell>
                  <TableCell>
                    <span className={
                      transaction.status === "成功" 
                        ? "text-green-600"
                        : transaction.status === "处理中"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }>
                      {transaction.status}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>
                    {transaction.type === "充值" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!transaction.canRefund}
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
                  <span className="font-medium">¥{selectedTransaction.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">充值时间</span>
                  <span className="font-medium">{selectedTransaction.date}</span>
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
              onClick={() => {
                // TODO: 处理退款逻辑
                setShowRefundDialog(false);
              }}
            >
              确认退款
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}