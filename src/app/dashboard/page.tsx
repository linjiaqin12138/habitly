'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCheckinProfiles, getCheckinRecords } from '@/lib/api/checkinApi';
import { getVault, getVaultTransactions } from '@/lib/api/vaultApi';
import { CheckinProfile, CheckinRecord, CheckinFrequency } from '@/types/checkin';
import { Vault, VaultTransaction } from '@/types/vault';
import PageLoading from '@/components/pageload';

interface DashboardData {
    profiles: CheckinProfile[];
    records: CheckinRecord[];
    vault: Vault;
    transactions: VaultTransaction[];
}

interface ProfileStats {
    id: string;
    title: string;
    todayStatus: '未打卡' | '已完成' | '不需要';
    monthlyCompletionRate: number;
    monthlyCompleted: number;
    streak: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            // 并行加载所有数据
            const [profilesRes, vaultRes, transactionsRes] = await Promise.all([
                getCheckinProfiles(),
                getVault(),
                getVaultTransactions(10)
            ]);

            // 获取最近2个月的打卡记录用于统计
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const records: CheckinRecord[] = []

            await Promise.all(profilesRes.profiles.map(async profile => {
                records.push(
                    ...(await getCheckinRecords({
                        profileId: profile.id,
                        startDate,
                        endDate,
                        limit: 100
                    })).records
                );
            }));
            records.sort((a, b) => new Date(b.checkinDate).getTime() - new Date(a.checkinDate).getTime());
            setData({
                profiles: profilesRes.profiles,
                records,
                vault: vaultRes.vault,
                transactions: transactionsRes.transactions
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '加载数据失败';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 计算打卡统计数据
    const calculateProfileStats = (profiles: CheckinProfile[], records: CheckinRecord[]): ProfileStats[] => {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        return profiles.map(profile => {
            const profileRecords = records.filter(r => r.profileId === profile.id);

            // 今日状态
            const todayRecord = profileRecords.find(r => r.checkinDate === today);
            const shouldCheckinToday = shouldCheckinOnDate(profile.frequency, new Date());

            let todayStatus: '未打卡' | '已完成' | '不需要';
            if (!shouldCheckinToday) {
                todayStatus = '不需要';
            } else if (todayRecord) {
                todayStatus = '已完成';
            } else {
                todayStatus = '未打卡';
            }

            // 本月记录
            const monthlyRecords = profileRecords.filter(r => r.checkinDate.startsWith(currentMonth));

            // 计算本月应该打卡的天数
            const daysInMonth = new Date().getDate();
            const expectedDays = calculateExpectedCheckinDays(profile.frequency, daysInMonth);

            // 月完成率
            const monthlyCompletionRate = expectedDays > 0 ? Math.round((monthlyRecords.length / expectedDays) * 100) : 0;

            // 连续天数（简化计算：连续的有效打卡天数）
            const streak = calculateStreak(profile.frequency, profileRecords);

            return {
                id: profile.id,
                title: profile.title,
                todayStatus,
                monthlyCompletionRate,
                monthlyCompleted: monthlyRecords.length,
                streak
            };
        });
    };

    // 判断指定日期是否应该打卡
    const shouldCheckinOnDate = (frequency: CheckinFrequency, date: Date): boolean => {
        switch (frequency.type) {
            case 'daily':
                return true;
            case 'weekly':
                const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ...
                return frequency.weeklyDays?.includes(dayOfWeek) ?? false;
            case 'custom':
                const dateStr = date.toISOString().split('T')[0];
                return frequency.customDates?.includes(dateStr) ?? false;
            default:
                return false;
        }
    };

    // 计算本月应该打卡的天数
    const calculateExpectedCheckinDays = (frequency: CheckinFrequency, daysInMonth: number): number => {
        switch (frequency.type) {
            case 'daily':
                return daysInMonth;
            case 'weekly':
                // 简化计算：假设一个月大约4周
                return (frequency.weeklyDays?.length ?? 0) * Math.ceil(daysInMonth / 7);
            case 'custom':
                const currentMonth = new Date().toISOString().slice(0, 7);
                return frequency.customDates?.filter(date => date.startsWith(currentMonth)).length ?? 0;
            default:
                return 0;
        }
    };

    // 计算连续天数
    const calculateStreak = (frequency: CheckinFrequency, records: CheckinRecord[]): number => {
        if (records.length === 0) return 0;

        // 按日期排序（最新的在前）
        const sortedRecords = records.sort((a, b) => b.checkinDate.localeCompare(a.checkinDate));

        let streak = 0;
        let currentDate = new Date();

        // 从今天往前检查
        for (let i = 0; i < 30; i++) { // 最多检查30天
            const dateStr = currentDate.toISOString().split('T')[0];

            if (shouldCheckinOnDate(frequency, currentDate)) {
                const hasRecord = sortedRecords.some(r => r.checkinDate === dateStr);
                if (hasRecord) {
                    streak++;
                } else {
                    break; // 连续中断
                }
            }

            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    };

    const handleCreateNew = () => {
        router.push('/checkin/new');
    };

    const handleCheckin = (profileId: string) => {
        router.push(`/checkin/${profileId}`);
    };

    const handleManageVault = () => {
        router.push('/vault');
    };

    if (loading) {
        return <PageLoading />
    }

    if (error) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!data) {
        return null;
    }

    const profileStats = calculateProfileStats(data.profiles, data.records);
    const totalMonthlyCheckins = profileStats.reduce((sum, p) => sum + p.monthlyCompleted, 0);
    const avgCompletionRate = profileStats.length > 0
        ? Math.round(profileStats.reduce((sum, p) => sum + p.monthlyCompletionRate, 0) / profileStats.length)
        : 0;

    // 最近记录（取最近的打卡记录，包含配置标题）
    const recentRecords = data.records
        .slice(0, 5)
        .map(record => {
            const profile = data.profiles.find(p => p.id === record.profileId);
            return {
                ...record,
                profileTitle: profile?.title || '未知配置'
            };
        });

    return (
        <div className="flex flex-col justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
            <div className="flex flex-col items-center mb-8">
                <h1 className="text-2xl font-bold mb-2">打卡配置管理</h1>
                <p className="text-gray-500">创建和管理您的习惯打卡配置</p>
            </div>
            <div className="w-full max-w-[1200px] grid gap-4 md:grid-cols-2 lg:grid-cols-3 px-8">
                {/* 打卡列表卡片 */}
                <Card className="md:col-span-2 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>我的打卡</CardTitle>
                            <CardDescription>今日打卡状态</CardDescription>
                        </div>
                        <Button size="sm" className="gap-1" onClick={handleCreateNew}>
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
                                            onClick={() => handleCheckin(stats.id)}
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

                {/* 小金库卡片 */}
                <Card>
                    <CardHeader>
                        <CardTitle>小金库</CardTitle>
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
                                    <div className="text-3xl font-bold text-primary">¥ {data.vault.totalAmount.toFixed(2)}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">当前金额</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">¥ {data.vault.availableRewards.toFixed(2)}</div>
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
                        <Button variant="outline" onClick={handleManageVault}>管理小金库</Button>
                    </CardFooter>
                </Card>

                {/* 最近记录卡片 */}
                <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>最近记录</CardTitle>
                        <CardDescription>所有配置最近的打卡记录</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            {recentRecords.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    还没有打卡记录
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentRecords.map((record, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 rounded-lg bg-muted"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <div>
                                                    <div className="font-medium">{record.profileTitle}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {new Date(record.checkinDate).toLocaleDateString('zh-CN')} · 已完成
                                                        {record.isRemedial && ' · 补卡'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-lg font-bold">{record.score}分</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}