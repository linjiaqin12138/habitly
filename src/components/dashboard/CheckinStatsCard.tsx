import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { ProfileStats } from './types';

interface CheckinStatsCardProps {
    profileStats: ProfileStats[];
    onCreateNew: () => void;
    onCheckin: (profileId: string) => void;
}

export default function CheckinStatsCard({
    profileStats,
    onCreateNew,
    onCheckin
}: CheckinStatsCardProps) {
    return (
        <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>我的打卡</CardTitle>
                    <CardDescription>今日打卡状态</CardDescription>
                </div>
                <Button size="sm" className="gap-1" onClick={onCreateNew}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>新建打卡</span>
                </Button>
            </CardHeader>
            <CardContent>
                {profileStats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        还没有打卡配置，点击右上角按钮创建第一个吧！
                    </div>
                ) : (
                    <div className="space-y-4">
                        {profileStats.map((stats) => (
                            <div
                                key={stats.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-muted"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold">{stats.title}</h3>
                                        <Badge variant={
                                            stats.todayStatus === "已完成" ? "default" :
                                                stats.todayStatus === "不需要" ? "secondary" : "secondary"
                                        }>
                                            {stats.todayStatus}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                                        <div>月完成率: {stats.monthlyCompletionRate}%</div>
                                        <div>本月: {stats.monthlyCompleted}次</div>
                                        <div>连续: {stats.streak}天</div>
                                    </div>
                                </div>
                                <Button
                                    className="ml-4"
                                    disabled={stats.todayStatus === "已完成" || stats.todayStatus === "不需要"}
                                    onClick={() => onCheckin(stats.id)}
                                >
                                    {stats.todayStatus === "已完成" ? "已打卡" :
                                        stats.todayStatus === "不需要" ? "无需打卡" : "去打卡"}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}