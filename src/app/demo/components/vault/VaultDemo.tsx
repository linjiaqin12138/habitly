"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

// 模拟数据
const mockVault = {
  vaultAmount: 5000,
  availableRewards: 200,
};

const mockTransactions = [
  {
    id: "1",
    type: "adjust",
    amount: 5000,
    balanceAfter: 5000,
    description: "设置小金库金额",
    createdAt: "2025-06-20T10:00:00Z"
  },
  {
    id: "2",
    type: "withdraw",
    amount: -200,
    balanceAfter: 4800,
    description: "完成7天连续打卡奖励",
    createdAt: "2025-06-20T15:00:00Z"
  }
];

export function VaultDemo() {
  const [vault, setVault] = useState(mockVault);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [loading, setLoading] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showSetAmountDialog, setShowSetAmountDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // 处理设置金额
  const handleSetAmount = async () => {
    const amount = parseFloat(newAmount);
    if (!newAmount || amount <= 0 || amount > 10000) {
      toast.error("请输入有效金额（1-10000元）");
      return;
    }

    setProcessingAction(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const transaction = {
        id: Date.now().toString(),
        type: "adjust" as const,
        amount: amount,
        balanceAfter: amount,
        description: "设置小金库金额",
        createdAt: new Date().toISOString()
      };

      setVault({ ...vault, vaultAmount: amount });
      setTransactions([transaction, ...transactions]);
      setShowSetAmountDialog(false);
      setNewAmount("");
      toast.success("小金库金额设置成功！");
    } catch (error) {
      console.error("设置失败:", error);
      toast.error("设置失败，请稍后重试");
    } finally {
      setProcessingAction(false);
    }
  };

  // 处理支取奖励
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || amount <= 0 || amount > vault.availableRewards) {
      toast.error("请输入有效的支取金额");
      return;
    }

    setProcessingAction(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const transaction = {
        id: Date.now().toString(),
        type: "withdraw" as const,
        amount: -amount,
        balanceAfter: vault.vaultAmount - amount,
        description: "支取奖励",
        createdAt: new Date().toISOString()
      };

      setVault({
        ...vault,
        vaultAmount: vault.vaultAmount - amount,
        availableRewards: vault.availableRewards - amount
      });
      setTransactions([transaction, ...transactions]);
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      toast.success("奖励支取成功！");
    } catch (error) {
      console.error("支取失败:", error);
      toast.error("支取失败，请稍后重试");
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 小金库卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>我的小金库</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">小金库总额</p>
                <p className="text-2xl font-bold">¥{vault.vaultAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">可支取奖励</p>
                <p className="text-2xl font-bold text-green-600">¥{vault.availableRewards.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => setShowSetAmountDialog(true)}
                className="flex-1"
              >
                设置金额
              </Button>
              <Button 
                onClick={() => setShowWithdrawDialog(true)}
                className="flex-1"
                disabled={vault.availableRewards <= 0}
                variant="secondary"
              >
                支取奖励
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>小金库规则</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-4 space-y-2">
              <li>设置您愿意为习惯养成投入的金额（最高1万元）</li>
              <li>完成打卡任务获得奖励</li>
              <li>随时可以修改小金库金额</li>
              <li>可支取奖励可以随时支取</li>
              <li>支取的奖励请自行从个人资金中支付给自己</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 交易记录 */}
      <Card>
        <CardHeader>
          <CardTitle>金额变动记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>时间</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>金额</TableCell>
                <TableCell>说明</TableCell>
                <TableCell>余额</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{transaction.type === 'adjust' ? '设置金额' : '支取奖励'}</TableCell>
                  <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.balanceAfter.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 设置金额对话框 */}
      <Dialog open={showSetAmountDialog} onOpenChange={setShowSetAmountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置小金库金额</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">金额（元）</label>
              <Input
                type="number"
                min="0"
                max="10000"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                placeholder="请输入金额（最高1万元）"
              />
            </div>
            <Button
              onClick={handleSetAmount}
              disabled={processingAction}
              className="w-full"
            >
              {processingAction ? "处理中..." : "确认"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 支取奖励对话框 */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>支取奖励</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">金额（元）</label>
              <Input
                type="number"
                min="0"
                max={vault.availableRewards}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder={`可支取金额：${vault.availableRewards}元`}
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={processingAction}
              className="w-full"
            >
              {processingAction ? "处理中..." : "确认支取"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
