'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getCheckinProfiles, getCheckinRecords } from '@/lib/api/checkinApi';
import { getVault, getVaultTransactions } from '@/lib/api/vaultApi';
import { CheckinRecord } from '@/types/checkin';
import PageLoading from '@/components/pageload';

// 导入拆分的组件
import CheckinStatsCard from '@/components/dashboard/CheckinStatsCard';
import VaultSummaryCard from '@/components/dashboard/VaultSummaryCard';
import ProfileSelector from '@/components/dashboard/ProfileSelector';
import CalendarCard from '@/components/dashboard/CalendarCard';
import TrendChart from '@/components/dashboard/TrendChart';
import RecentRecordsCard from '@/components/dashboard/RecentRecordsCard';

// 导入类型和工具函数
import { DashboardData, ProfileOption, CheckinRecordWithProfile } from '@/components/dashboard/types';
import { calculateProfileStats } from '@/components/dashboard/utils';

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
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

    // 事件处理函数
    const handleCreateNew = () => {
        router.push('/checkin/new');
    };

    const handleCheckin = (profileId: string) => {
        router.push(`/checkin/${profileId}`);
    };

    const handleManageVault = () => {
        router.push('/vault');
    };

    const handleSelectProfile = (profileId: string) => {
        setSelectedProfile(profileId);
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
    console.log("Dashboard data:", data);

    // 计算统计数据
    const profileStats = calculateProfileStats(data.profiles, data.records);
    const totalMonthlyCheckins = profileStats.reduce((sum, p) => sum + p.monthlyCompleted, 0);
    const avgCompletionRate = profileStats.length > 0
        ? Math.round(profileStats.reduce((sum, p) => sum + p.monthlyCompletionRate, 0) / profileStats.length)
        : 0;

    // 最近记录（取最近的打卡记录，包含配置标题）
    const recentRecords: CheckinRecordWithProfile[] = data.records
        .slice(0, 5)
        .map(record => {
            const profile = data.profiles.find(p => p.id === record.profileId);
            return {
                ...record,
                profileTitle: profile?.title || '未知配置'
            };
        });

    // 配置选择选项
    const profileOptions: ProfileOption[] = [
        { id: "all", title: "所有配置" },
        ...data.profiles.map(p => ({ id: p.id, title: p.title }))
    ];

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
            <div className="flex flex-col items-center mb-8">
                <h1 className="text-2xl font-bold mb-2">打卡总览</h1>
                <p className="text-gray-500">创建和管理您的习惯打卡配置</p>
            </div>
            <div className="w-full max-w-[1200px] space-y-6 px-8">
                {/* 第一行：打卡列表 + 小金库 */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <CheckinStatsCard
                        profileStats={profileStats}
                        onCreateNew={handleCreateNew}
                        onCheckin={handleCheckin}
                    />
                    
                    <VaultSummaryCard
                        vault={data.vault}
                        avgCompletionRate={avgCompletionRate}
                        totalMonthlyCheckins={totalMonthlyCheckins}
                        onManageVault={handleManageVault}
                    />
                </div>

                {/* 第二行：配置筛选 */}
                <ProfileSelector
                    profileOptions={profileOptions}
                    selectedProfile={selectedProfile}
                    onSelectProfile={handleSelectProfile}
                />

                {/* 第三行：日历 + 趋势图 */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <CalendarCard
                            profiles={data.profiles}
                            records={data.records}
                            selectedProfile={selectedProfile}
                            profileOptions={profileOptions}
                        />
                    </div>

                    <div className="lg:col-span-2">
                        <TrendChart
                            profiles={data.profiles}
                            records={data.records}
                            selectedProfile={selectedProfile}
                        />
                    </div>
                </div>

                {/* 第四行：最近记录 */}
                <RecentRecordsCard recentRecords={recentRecords} />
            </div>
        </div>
    );
}