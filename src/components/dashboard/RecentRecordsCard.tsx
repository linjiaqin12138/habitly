import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { CheckinRecordWithProfile } from './types';

interface RecentRecordsCardProps {
    recentRecords: CheckinRecordWithProfile[];
}

export default function RecentRecordsCard({
    recentRecords
}: RecentRecordsCardProps) {
    return (
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
    );
}