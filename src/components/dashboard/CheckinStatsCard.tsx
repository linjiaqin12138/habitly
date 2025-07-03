import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Settings } from "lucide-react";
import { ProfileStats, TodayStatus } from './types';

interface CheckinStatsCardProps {
    profileStats: ProfileStats[];
    onCreateNew: () => void;
    onCheckin: (profileId: string) => void;
    onManage: () => void;
}

export default function CheckinStatsCard({
    profileStats,
    onCreateNew,
    onCheckin,
    onManage
}: CheckinStatsCardProps) {
    return (
        <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>我的打卡</CardTitle>
                    <CardDescription>今日打卡状态</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={onManage}>
                        <Settings className="h-3.5 w-3.5" />
                        <span>打卡管理</span>
                    </Button>
                    <Button size="sm" className="gap-1" onClick={onCreateNew}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>新建打卡</span>
                    </Button>
                </div>
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
                                            stats.todayStatus === TodayStatus.COMPLETED ? "default" : "secondary"
                                        }>
                                            {stats.todayStatus === TodayStatus.COMPLETED ? "已完成" : 
                                             stats.todayStatus === TodayStatus.NOT_REQUIRED ? "不需要" : "未打卡"}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                                        <div>月完成率: {stats.monthlyCompletionRate}%</div>
                                        <div>本月: {stats.monthlyCompleted}次</div>
                                        <div>连续: {stats.streak}天</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="ml-4"
                                    disabled={stats.todayStatus === TodayStatus.COMPLETED || stats.todayStatus === TodayStatus.NOT_REQUIRED || !stats.isActive}
                                    onClick={() => onCheckin(stats.id)}
                                >
                                    {stats.todayStatus === TodayStatus.COMPLETED ? "已打卡" :
                                        stats.todayStatus === TodayStatus.NOT_REQUIRED ? "无需打卡" : 
                                            stats.isActive ? "去打卡" : '未启用'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}