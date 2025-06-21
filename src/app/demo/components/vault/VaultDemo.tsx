"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// 模拟数据
const mockVault = {
  vaultRemaining: 5000,
  availableRewards: 150,
};

const mockTransactions = [
  {
    id: "1",
    type: "adjust",
    amount: 5000,
    balanceAfter: 5000,
    description: "设置小金库金额",
    createdAt: "2025-06-20T10:00:00Z"
  },  {
    id: "2",
    type: "reward",
    amount: 200,
    balanceAfter: 4800,
    description: "完成7天连续打卡奖励",
    createdAt: "2025-06-20T15:00:00Z"
  },
  {
    id: "3",
    type: "spend",
    amount: 50,
    balanceAfter: 150,
    description: "购买咖啡奖励自己",
    createdAt: "2025-06-20T16:30:00Z"
  },
  {
    id: "4",
    type: "adjust",
    amount: 3000,
    balanceAfter: 3000,
    description: "调整小金库金额",
    createdAt: "2025-06-19T14:30:00Z"
  },
  {
    id: "5",
    type: "reward",
    amount: 100,
    balanceAfter: 2900,
    description: "完成3天连续打卡奖励",
    createdAt: "2025-06-19T16:20:00Z"
  },
  {
    id: "6",
    type: "spend",
    amount: 30,
    balanceAfter: 120,
    description: "买了一本书",
    createdAt: "2025-06-19T18:45:00Z"
  },
  {
    id: "7",
    type: "reward",
    amount: 50,
    balanceAfter: 2850,
    description: "完成每日目标奖励",
    createdAt: "2025-06-17T20:15:00Z"
  }
];

export function VaultDemo() {  const [vault, setVault] = useState(mockVault);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [newAmount, setNewAmount] = useState("");
  const [showSetAmountDialog, setShowSetAmountDialog] = useState(false);
  const [showSpendDialog, setShowSpendDialog] = useState(false);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendDescription, setSpendDescription] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // 过滤交易记录
  const adjustTransactions = transactions.filter(t => t.type === 'adjust');
  const rewardTransactions = transactions.filter(t => t.type === 'reward');
  const spendTransactions = transactions.filter(t => t.type === 'spend');
  // 处理设置剩余金额
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

      setVault({ ...vault, vaultRemaining: amount });
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

  // 处理消费奖励
  const handleSpendReward = async () => {
    const amount = parseFloat(spendAmount);
    if (!spendAmount || amount <= 0) {
      toast.error("请输入有效的消费金额");
      return;
    }
    
    if (amount > vault.availableRewards) {
      toast.error("消费金额不能超过可支配奖励余额");
      return;
    }

    setProcessingAction(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAvailableRewards = vault.availableRewards - amount;
      const transaction = {
        id: Date.now().toString(),
        type: "spend" as const,
        amount: amount,
        balanceAfter: newAvailableRewards,
        description: spendDescription || "奖励消费",
        createdAt: new Date().toISOString()
      };

      setVault({ ...vault, availableRewards: newAvailableRewards });
      setTransactions([transaction, ...transactions]);
      setShowSpendDialog(false);
      setSpendAmount("");
      setSpendDescription("");
      toast.success("奖励消费成功！");
    } catch (error) {
      console.error("消费失败:", error);
      toast.error("消费失败，请稍后重试");
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
                <p className="text-sm text-gray-500">剩余金额</p>
                <p className="text-2xl font-bold">¥{vault.vaultRemaining.toFixed(2)}</p>
              </div>              <div>
                <p className="text-sm text-gray-500">可支配奖励</p>
                <p className="text-2xl font-bold text-green-600">¥{vault.availableRewards.toFixed(2)}</p>
              </div>
            </div>            <div className="flex gap-4">
              <Button 
                onClick={() => setShowSetAmountDialog(true)}
                className="flex-1"
              >
                设置金额
              </Button>
              <Button 
                onClick={() => setShowSpendDialog(true)}
                variant="outline"
                className="flex-1"
                disabled={vault.availableRewards <= 0}
              >
                消费奖励
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
      </div>      {/* 历史记录 - 标签页布局 */}
      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="adjust">设置金额</TabsTrigger>
              <TabsTrigger value="reward">奖励发放</TabsTrigger>
              <TabsTrigger value="spend">奖励消费</TabsTrigger>
            </TabsList>
            
            <TabsContent value="adjust" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>时间</TableCell>
                    <TableCell>说明</TableCell>
                    <TableCell>金额</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-blue-600">
                        ¥{transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {adjustTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        暂无设置记录
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="reward" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>时间</TableCell>
                    <TableCell>说明</TableCell>
                    <TableCell>金额</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-green-600">
                        +¥{transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rewardTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        暂无奖励记录
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="spend" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>时间</TableCell>
                    <TableCell>说明</TableCell>
                    <TableCell>金额</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spendTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-red-600">
                        ¥{transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {spendTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        暂无消费记录
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>      {/* 设置金额对话框 */}
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

      {/* 消费奖励对话框 */}
      <Dialog open={showSpendDialog} onOpenChange={setShowSpendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>消费奖励</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">
                消费金额（元）
                <span className="text-xs text-gray-400 ml-2">
                  可用余额：¥{vault.availableRewards.toFixed(2)}
                </span>
              </label>
              <Input
                type="number"
                min="0"
                max={vault.availableRewards}
                step="0.01"
                value={spendAmount}
                onChange={e => setSpendAmount(e.target.value)}
                placeholder="请输入消费金额"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500">消费说明（可选）</label>
              <Textarea
                value={spendDescription}
                onChange={e => setSpendDescription(e.target.value)}
                placeholder="请输入消费说明，如：购买咖啡、买书等"
                rows={3}
              />
            </div>
            <Button
              onClick={handleSpendReward}
              disabled={processingAction}
              className="w-full"
            >
              {processingAction ? "处理中..." : "确认消费"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
