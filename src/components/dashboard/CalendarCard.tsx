import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CheckinProfile, CheckinRecord } from '@/types/checkin';
import { ProfileOption } from './types';
import { getDateStatus, getRecordsForDate } from './utils';
import { getLocalDateString } from '@/lib/utils/dateUtils';

interface CalendarCardProps {
    profiles: CheckinProfile[];
    records: CheckinRecord[];
    selectedProfile: string;
    profileOptions: ProfileOption[];
}

export default function CalendarCard({
    profiles,
    records,
    selectedProfile,
    profileOptions
}: CalendarCardProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const router = useRouter();

    // 处理日期选择
    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        
        // 只在单个配置视图下支持点击跳转
        if (date && selectedProfile !== "all") {
            const dateStatus = getDateStatus(date, profiles, records, selectedProfile);
            if (dateStatus === 'canMakeup') {
                const dateStr = getLocalDateString(date); // 修复：使用本地日期
                router.push(`/checkin/makeup/${selectedProfile}?date=${dateStr}`);
            }
        }
    };

    // 获取指定日期的打卡记录
    const selectedDateRecords = selectedDate ? getRecordsForDate(selectedDate, profiles, records) : [];

    return (
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
                        onTime: (date) => getDateStatus(date, profiles, records, selectedProfile) === 'onTime',
                        remedial: (date) => getDateStatus(date, profiles, records, selectedProfile) === 'remedial',
                        canMakeup: (date) => getDateStatus(date, profiles, records, selectedProfile) === 'canMakeup',
                        missed: (date) => getDateStatus(date, profiles, records, selectedProfile) === 'missed',
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
                        canMakeup: {
                            backgroundColor: "#fb923c", // 橙色 - 可补救的缺卡
                            color: "white",
                            cursor: selectedProfile !== "all" ? "pointer" : "default",
                        },
                        missed: {
                            backgroundColor: "#ef4444", // 红色 - 不可补救的缺卡
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
    );
}