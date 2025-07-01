"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 模拟问卷类型
const questionnaires = [
  { id: "all", title: "所有问卷" },
  { id: "qnr1", title: "每日情绪记录" },
  { id: "qnr2", title: "每周工作复盘" },
  { id: "qnr3", title: "健身习惯追踪" },
];

// 模拟历史数据
const mockHistoryData = [
  { 
    date: "2025-05-01", 
    questionnaireId: "qnr1",
    questionnaireTitle: "每日情绪记录",
    score: 85, 
    answers: { "今日心情": "愉悦", "压力指数": "3", "心情描述": "工作顺利，心情不错" } 
  },
  { 
    date: "2025-05-02", 
    questionnaireId: "qnr2",
    questionnaireTitle: "每周工作复盘",
    score: 92, 
    answers: { "本周目标完成度": "85%", "遇到的挑战": "项目进度稍有延迟", "解决方案": "调整了任务优先级" } 
  },
  { 
    date: "2025-05-03", 
    questionnaireId: "qnr3",
    questionnaireTitle: "健身习惯追踪",
    score: 88, 
    answers: { "运动时长": "45分钟", "运动类型": "力量训练", "感受": "状态良好" } 
  },
  { 
    date: "2025-05-04", 
    questionnaireId: "qnr1",
    questionnaireTitle: "每日情绪记录",
    score: 95, 
    answers: { "今日心情": "开心", "压力指数": "2", "心情描述": "完成了重要任务" } 
  },
];

// 生成每个问卷30天的趋势数据
const generateTrendData = () => {
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2025, 4, i + 1);
    return date.toISOString().split('T')[0];
  });

  return dates.map(date => ({
    name: date.split('-')[2], // 日期数字
    date: date,
    "每日情绪记录": Math.floor(Math.random() * 30) + 70,
    "每周工作复盘": Math.floor(Math.random() * 30) + 70,
    "健身习惯追踪": Math.floor(Math.random() * 30) + 70,
  }));
};

const mockTrendData = generateTrendData();

// 定义问卷对应的颜色
const questionnaireColors = {
  "每日情绪记录": "#3b82f6", // blue
  "每周工作复盘": "#10b981", // green  
  "健身习惯追踪": "#f59e0b", // amber
};

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

export function HistoryDemo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayData, setSelectedDayData] = useState<any>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("all");

  // 根据选择的问卷过滤历史数据
  const filteredHistoryData = selectedQuestionnaire === "all"
    ? mockHistoryData
    : mockHistoryData.filter(record => record.questionnaireId === selectedQuestionnaire);

  // 判断日期是否有打卡记录
  const hasRecord = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredHistoryData.some(record => record.date === dateStr);
  };

  // 处理日期选择
  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      const dayData = filteredHistoryData.filter(record => record.date === dateStr);
      setSelectedDayData(dayData);
    }
  };

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      <div className="w-[200px]">
        <Select value={selectedQuestionnaire} onValueChange={setSelectedQuestionnaire}>
          <SelectTrigger>
            <SelectValue placeholder="选择问卷" />
          </SelectTrigger>
          <SelectContent>
            {questionnaires.map(q => (
              <SelectItem key={q.id} value={q.id}>
                {q.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 日历卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>打卡日历</CardTitle>
            <CardDescription>
              {selectedQuestionnaire === "all" 
                ? "显示所有问卷的打卡记录" 
                : `显示 ${questionnaires.find(q => q.id === selectedQuestionnaire)?.title} 的打卡记录`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              modifiers={{
                completed: (date) => hasRecord(date),
              }}
              modifiersStyles={{
                completed: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                },
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* 趋势图卡片 */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>得分趋势</CardTitle>
            <CardDescription>各问卷得分变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart
                  data={mockTrendData}
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
                    domain={[60, 100]}
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickCount={5}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedQuestionnaire === "all" ? (
                    // 显示所有问卷的线
                    Object.entries(questionnaireColors).map(([name, color]) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        name={name}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2,
                          stroke: color,
                          fill: "white"
                        }}
                      />
                    ))
                  ) : (
                    // 只显示选中问卷的线
                    (() => {
                      const selectedTitle = questionnaires.find(q => q.id === selectedQuestionnaire)?.title;
                      const color = selectedTitle ? questionnaireColors[selectedTitle as keyof typeof questionnaireColors] : "#3b82f6";
                      return selectedTitle ? (
                        <Line
                          key={selectedTitle}
                          type="monotone"
                          dataKey={selectedTitle}
                          name={selectedTitle}
                          stroke={color}
                          strokeWidth={2}
                          dot={false}
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

      {/* 详细记录卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
          <CardDescription>
            {selectedQuestionnaire === "all" 
              ? "所有问卷的打卡记录" 
              : `${questionnaires.find(q => q.id === selectedQuestionnaire)?.title} 的打卡记录`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {filteredHistoryData.map((record) => (
                <HoverCard key={`${record.date}-${record.questionnaireId}`}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div>
                          <div className="font-medium">{record.date}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.questionnaireTitle}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">{record.score}分</div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">{record.questionnaireTitle}</h4>
                      {Object.entries(record.answers).map(([question, answer]) => (
                        <div key={question} className="text-sm">
                          <div className="font-medium">{question}：</div>
                          <div className="text-muted-foreground">{answer}</div>
                        </div>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}