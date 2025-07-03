import { CheckinProfile, CheckinRecord, CheckinFrequency } from '@/types/checkin';
import { ProfileStats, TodayStatus } from './types';
import { getLocalDateString, getLocalYearMonthString } from '@/lib/utils/dateUtils';

// 计算打卡统计数据
export const calculateProfileStats = (profiles: CheckinProfile[], records: CheckinRecord[]): ProfileStats[] => {
    const today = getLocalDateString(); // 修复：使用本地日期
    const currentMonth = getLocalYearMonthString(); // 修复：使用本地年月

    return profiles.map(profile => {
        const profileRecords = records.filter(r => r.profileId === profile.id);

        // 今日状态
        const todayRecord = profileRecords.find(r => r.checkinDate === today);
        const shouldCheckinToday = shouldCheckinOnDate(profile.frequency, new Date());

        let todayStatus: TodayStatus | undefined;
        if (profile.isActive) {
            if (!shouldCheckinToday) {
                todayStatus = TodayStatus.NOT_REQUIRED;
            } else if (todayRecord) {
                todayStatus = TodayStatus.COMPLETED;
            } else {
                todayStatus = TodayStatus.NOT_CHECKED;
            }
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
            streak,
            isActive: profile.isActive
        };
    });
};

// 判断指定日期是否应该打卡
export const shouldCheckinOnDate = (frequency: CheckinFrequency, date: Date): boolean => {
    switch (frequency.type) {
        case 'daily':
            return true;
        case 'weekly':
            const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ...
            return frequency.weeklyDays?.includes(dayOfWeek) ?? false;
        case 'custom':
            const dateStr = getLocalDateString(date); // 修复：使用本地日期
            return frequency.customDates?.includes(dateStr) ?? false;
        default:
            return false;
    }
};

// 计算本月应该打卡的天数
export const calculateExpectedCheckinDays = (frequency: CheckinFrequency, daysInMonth: number): number => {
    switch (frequency.type) {
        case 'daily':
            return daysInMonth;
        case 'weekly':
            // 简化计算：假设一个月大约4周
            return (frequency.weeklyDays?.length ?? 0) * Math.ceil(daysInMonth / 7);
        case 'custom':
            const currentMonth = getLocalYearMonthString(); // 修复：使用本地年月
            return frequency.customDates?.filter(date => date.startsWith(currentMonth)).length ?? 0;
        default:
            return 0;
    }
};

// 计算连续天数
export const calculateStreak = (frequency: CheckinFrequency, records: CheckinRecord[]): number => {
    if (records.length === 0) return 0;

    // 按日期排序（最新的在前）
    const sortedRecords = records.sort((a, b) => b.checkinDate.localeCompare(a.checkinDate));

    let streak = 0;
    const currentDate = new Date();

    // 从今天往前检查
    for (let i = 0; i < 30; i++) { // 最多检查30天
        const dateStr = getLocalDateString(currentDate); // 修复：使用本地日期

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
export const generateTrendData = (profiles: CheckinProfile[], records: CheckinRecord[]) => {
    const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 29 + i);
        return getLocalDateString(date); // 修复：使用本地日期
    });

    return dates.map(date => {
        const dayData: Record<string, string | number | null> = {
            name: new Date(date).getDate().toString(),
            date: date,
        };

        // 为每个配置添加该日期的得分
        profiles.forEach(profile => {
            const record = records.find(r =>
                r.profileId === profile.id && r.checkinDate === date
            );
            dayData[profile.title] = record ? record.score : null;
        });

        return dayData;
    });
};

// 判断日期的打卡状态
export const getDateStatus = (
    date: Date, 
    profiles: CheckinProfile[], 
    records: CheckinRecord[], 
    selectedProfile: string
): 'onTime' | 'remedial' | 'canMakeup' | 'missed' | 'none' => {
    const dateStr = getLocalDateString(date); // 修复：使用本地日期

    // 获取该日期的记录
    let dateRecords: CheckinRecord[] = [];
    if (selectedProfile === "all") {
        dateRecords = records.filter(record => record.checkinDate === dateStr);
    } else {
        dateRecords = records.filter(record =>
            record.profileId === selectedProfile && record.checkinDate === dateStr
        );
    }

    // 检查是否应该打卡
    let shouldCheckin = false;
    if (selectedProfile === "all") {
        // 检查任意一个配置是否需要在这天打卡
        shouldCheckin = profiles.some(profile => shouldCheckinOnDate(profile.frequency, date));
    } else {
        const profile = profiles.find(p => p.id === selectedProfile);
        shouldCheckin = profile ? shouldCheckinOnDate(profile.frequency, date) : false;
    }

    if (!shouldCheckin) {
        return 'none'; // 不需要打卡的日期
    }

    if (dateRecords.length === 0) {
        // 应该打卡但没有记录
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        // 只检查今天之前的日期
        if (date < today && profiles.some(profile => new Date(profile.createdAt) <= date)) {
            // 检查是否在可补救范围内（过去3天）
            const threeDaysAgo = new Date(today);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            
            if (date >= threeDaysAgo) {
                return 'canMakeup'; // 可补救的缺卡
            } else {
                return 'missed'; // 不可补救的缺卡
            }
        }
        return 'none'
    }

    // 有记录，检查是否有补救打卡
    const hasRemedial = dateRecords.some(record => record.isRemedial);
    return hasRemedial ? 'remedial' : 'onTime';
};

// 获取指定日期的打卡记录
export const getRecordsForDate = (date: Date, profiles: CheckinProfile[], records: CheckinRecord[]) => {
    const dateStr = getLocalDateString(date); // 修复：使用本地日期

    const dateRecords = records.filter(record => record.checkinDate === dateStr);
    return dateRecords.map(record => {
        const profile = profiles.find(p => p.id === record.profileId);
        return {
            ...record,
            profileTitle: profile?.title || '未知配置'
        };
    });
};

// 定义配置对应的颜色
export const profileColors = [
    "#3b82f6", // blue
    "#10b981", // green  
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
];