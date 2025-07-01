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
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PlusCircle, AlertCircle } from "lucide-react";
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

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-lg shadow-sm p-2 text-sm">
        <p className="text-muted-foreground">{`${label}日`}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="font-medium" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}分`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 定义配置对应的颜色
const profileColors = [
  "#3b82f6", // blue
  "#10b981", // green  
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedProfile, setSelectedProfile] = useState<string>("all");

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
        const currentDate = new Date();

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

    // 生成趋势数据
    const generateTrendData = () => {
        if (!data) return [];
        
        const dates = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 29 + i);
            return date.toISOString().split('T')[0];
        });

        return dates.map(date => {
            const dayData: any = {
                name: new Date(date).getDate().toString(),
                date: date,
            };

            // 为每个配置添加该日期的得分
            data.profiles.forEach(profile => {
                const record = data.records.find(r => 
                    r.profileId === profile.id && r.checkinDate === date
                );
                dayData[profile.title] = record ? record.score : null;
            });

            return dayData;
        });
    };

    // 判断日期是否有打卡记录
    const hasRecord = (date: Date) => {
        if (!data) return false;
        const dateStr = date.toISOString().split('T')[0];
        
        if (selectedProfile === "all") {
            return data.records.some(record => record.checkinDate === dateStr);
        } else {
            return data.records.some(record => 
                record.profileId === selectedProfile && record.checkinDate === dateStr
            );
        }
    };

    // 判断日期的打卡状态
    const getDateStatus = (date: Date): 'onTime' | 'remedial' | 'missed' | 'none' => {
        if (!data) return 'none';
        const dateStr = date.toISOString().split('T')[0];
        
        // 获取该日期的记录
        let dateRecords: CheckinRecord[] = [];
        if (selectedProfile === "all") {
            dateRecords = data.records.filter(record => record.checkinDate === dateStr);
        } else {
            dateRecords = data.records.filter(record => 
                record.profileId === selectedProfile && record.checkinDate === dateStr
            );
        }

        // 检查是否应该打卡
        let shouldCheckin = false;
        if (selectedProfile === "all") {
            // 检查任意一个配置是否需要在这天打卡
            shouldCheckin = data.profiles.some(profile => shouldCheckinOnDate(profile.frequency, date));
        } else {
            const profile = data.profiles.find(p => p.id === selectedProfile);
            shouldCheckin = profile ? shouldCheckinOnDate(profile.frequency, date) : false;
        }

        if (!shouldCheckin) {
            return 'none'; // 不需要打卡的日期
        }

        if (dateRecords.length === 0) {
            // 应该打卡但没有记录 - 只有今天之前的日期才算missed
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            return date < today ? 'missed' : 'none';
        }

        // 有记录，检查是否有补救打卡
        const hasRemedial = dateRecords.some(record => record.isRemedial);
        return hasRemedial ? 'remedial' : 'onTime';
    };

    // 获取指定日期的打卡记录
    const getRecordsForDate = (date: Date) => {
        if (!data) return [];
        const dateStr = date.toISOString().split('T')[0];
        
        const records = data.records.filter(record => record.checkinDate === dateStr);
        return records.map(record => {
            const profile = data.profiles.find(p => p.id === record.profileId);
            return {
                ...record,
                profileTitle: profile?.title || '未知配置'
            };
        });
    };

    // 处理日期选择
    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
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

    // 趋势数据
    const trendData = generateTrendData();

    // 当前选中日期的记录
    const selectedDateRecords = selectedDate ? getRecordsForDate(selectedDate) : [];

    // 配置选择选项
    const profileOptions = [
        { id: "all", title: "所有配置" },
        ...data.profiles.map(p => ({ id: p.id, title: p.title }))
    ];

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
            <div className="flex flex-col items-center mb-8">
                <h1 className="text-2xl font-bold mb-2">打卡配置管理</h1>
                <p className="text-gray-500">创建和管理您的习惯打卡配置</p>
            </div>
            <div className="w-full max-w-[1200px] space-y-6 px-8">
                {/* 第一行：打卡列表 + 小金库 */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                </div>

                {/* 第二行：配置筛选 */}
                <div className="w-[200px]">
                    <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                        <SelectTrigger>
                            <SelectValue placeholder="选择配置" />
                        </SelectTrigger>
                        <SelectContent>
                            {profileOptions.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 第三行：日历 + 趋势图 */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* 日历卡片 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>打卡日历</CardTitle>
                            <CardDescription>
                                {selectedProfile === "all" 
                                    ? "显示所有配置的打卡记录" 
                                    : `显示 ${profileOptions.find(p => p.id === selectedProfile)?.title} 的打卡记录`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                modifiers={{
                                    onTime: (date) => getDateStatus(date) === 'onTime',
                                    remedial: (date) => getDateStatus(date) === 'remedial',
                                    missed: (date) => getDateStatus(date) === 'missed',
                                }}
                                modifiersStyles={{
                                    onTime: {
                                        backgroundColor: "#10b981", // 绿色 - 按时打卡
                                        color: "white",
                                    },
                                    remedial: {
                                        backgroundColor: "#f59e0b", // 黄色 - 补救打卡
                                        color: "white",
                                    },
                                    missed: {
                                        backgroundColor: "#ef4444", // 红色 - 应该打卡但没打卡
                                        color: "white",
                                    },
                                }}
                                className="rounded-md border"
                            />
                            {selectedDate && selectedDateRecords.length > 0 && (
                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                    <h4 className="font-semibold mb-2">{selectedDate.toLocaleDateString('zh-CN')} 的打卡记录</h4>
                                    <div className="space-y-2">
                                        {selectedDateRecords.map((record, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <span>{record.profileTitle}</span>
                                                <span className="font-medium">{record.score}分</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 趋势图卡片 */}
                    <Card className="min-h-[400px]">
                        <CardHeader>
                            <CardTitle>得分趋势</CardTitle>
                            <CardDescription>最近30天的打卡得分变化</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer>
                                    <LineChart
                                        data={trendData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid 
                                            strokeDasharray="3 3" 
                                            horizontal={true}
                                            vertical={false}
                                            stroke="#e5e7eb" 
                                            opacity={0.5} 
                                        />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickCount={6}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        {selectedProfile === "all" ? (
                                            // 显示所有配置的线
                                            data.profiles.map((profile, index) => (
                                                <Line
                                                    key={profile.id}
                                                    type="monotone"
                                                    dataKey={profile.title}
                                                    name={profile.title}
                                                    stroke={profileColors[index % profileColors.length]}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    connectNulls={false}
                                                    activeDot={{
                                                        r: 6,
                                                        strokeWidth: 2,
                                                        stroke: profileColors[index % profileColors.length],
                                                        fill: "white"
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            // 只显示选中配置的线
                                            (() => {
                                                const selectedProfileData = data.profiles.find(p => p.id === selectedProfile);
                                                const profileIndex = data.profiles.findIndex(p => p.id === selectedProfile);
                                                const color = profileColors[profileIndex % profileColors.length];
                                                return selectedProfileData ? (
                                                    <Line
                                                        key={selectedProfileData.id}
                                                        type="monotone"
                                                        dataKey={selectedProfileData.title}
                                                        name={selectedProfileData.title}
                                                        stroke={color}
                                                        strokeWidth={2}
                                                        dot={false}
                                                        connectNulls={false}
                                                        activeDot={{
                                                            r: 6,
                                                            strokeWidth: 2,
                                                            stroke: color,
                                                            fill: "white"
                                                        }}
                                                    />
                                                ) : null;
                                            })()
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 第四行：最近记录 */}
                <Card>
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
                                        <HoverCard key={index}>
                                            <HoverCardTrigger asChild>
                                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted cursor-pointer">
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
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-80">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-semibold">{record.profileTitle}</h4>
                                                    <div className="text-sm">
                                                        <div className="font-medium">得分：{record.score}分</div>
                                                        <div className="text-muted-foreground">奖励：¥{record.rewardAmount.toFixed(2)}</div>
                                                        {record.isRemedial && <div className="text-muted-foreground">补救打卡</div>}
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
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