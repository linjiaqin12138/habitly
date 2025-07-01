import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Vault } from '@/types/vault';

interface VaultSummaryCardProps {
    vault: Vault;
    avgCompletionRate: number;
    totalMonthlyCheckins: number;
    onManageVault: () => void;
}

export default function VaultSummaryCard({
    vault,
    avgCompletionRate,
    totalMonthlyCheckins,
    onManageVault
}: VaultSummaryCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>小金库与计划完成度总览</CardTitle>
                <CardDescription>{new Date().toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-16">
                    <div className="grid grid-cols-2 gap-4 gap-y-16 pt-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary">¥ {vault.totalAmount.toFixed(2)}</div>
                            <div className="mt-1 text-sm text-muted-foreground">当前金额</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">¥ {vault.availableRewards.toFixed(2)}</div>
                            <div className="mt-1 text-sm text-muted-foreground">可支取奖励</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{avgCompletionRate}%</div>
                            <div className="text-sm text-muted-foreground">总完成率</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{totalMonthlyCheckins}</div>
                            <div className="text-sm text-muted-foreground">本月总打卡</div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="justify-center">
                <Button variant="outline" onClick={onManageVault}>管理小金库</Button>
            </CardFooter>
        </Card>
    );
}