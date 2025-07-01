import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CheckinProfile, CheckinRecord } from '@/types/checkin';
import { CheckinRecordWithProfile, ProfileOption } from './types';
import { getDateStatus, getRecordsForDate } from './utils';

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

    // 处理日期选择
    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
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
    );
}