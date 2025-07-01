import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckinProfile, CheckinRecord } from '@/types/checkin';
import { generateTrendData, profileColors } from './utils';

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
        dataKey: string;
        name: string;
        value: number;
        color: string;
    }>;
    label?: string;
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border rounded-lg shadow-sm p-2 text-sm">
                <p className="text-muted-foreground">{`${label}日`}</p>
                {payload.map((entry) => (
                    <p key={entry.dataKey} className="font-medium" style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value}分`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

interface TrendChartProps {
    profiles: CheckinProfile[];
    records: CheckinRecord[];
    selectedProfile: string;
}

export default function TrendChart({
    profiles,
    records,
    selectedProfile
}: TrendChartProps) {
    // 趋势数据
    const trendData = generateTrendData(profiles, records);

    return (
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
                                profiles.map((profile, index) => (
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
                                    const selectedProfileData = profiles.find(p => p.id === selectedProfile);
                                    const profileIndex = profiles.findIndex(p => p.id === selectedProfile);
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
    );
}