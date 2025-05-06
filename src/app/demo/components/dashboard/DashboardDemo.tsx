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
import { PlusCircle } from "lucide-react";

// 模拟问卷数据
const questionnaires = [
  {
    id: "qnr1",
    title: "每日情绪记录",
    todayStatus: "未打卡",
    monthlyCompletionRate: 80,
    monthlyCompleted: 24,
    streak: 7,
  },
  {
    id: "qnr2",
    title: "每周工作复盘",
    todayStatus: "已完成",
    monthlyCompletionRate: 75,
    monthlyCompleted: 3,
    streak: 3,
  },
  {
    id: "qnr3",
    title: "健身习惯追踪",
    todayStatus: "未打卡",
    monthlyCompletionRate: 60,
    monthlyCompleted: 18,
    streak: 0,
  }
];

export function DashboardDemo() {
  return (
    <div className="w-full max-w-[1200px] grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 问卷列表卡片 */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>我的问卷</CardTitle>
            <CardDescription>今日打卡状态</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>新建问卷</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questionnaires.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{q.title}</h3>
                    <Badge variant={q.todayStatus === "已完成" ? "default" : "secondary"}>
                      {q.todayStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>月完成率: {q.monthlyCompletionRate}%</div>
                    <div>本月: {q.monthlyCompleted}次</div>
                    <div>连续: {q.streak}天</div>
                  </div>
                </div>
                <Button
                  className="ml-4"
                  disabled={q.todayStatus === "已完成"}
                >
                  {q.todayStatus === "已完成" ? "已打卡" : "去打卡"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 账户统计卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>账户概览</CardTitle>
          <CardDescription>2025年5月5日</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">¥ 280.00</div>
              <div className="mt-2 text-sm text-muted-foreground">账户余额</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">72%</div>
                <div className="text-sm text-muted-foreground">总完成率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">45/60</div>
                <div className="text-sm text-muted-foreground">本月总打卡</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline">充值</Button>
        </CardFooter>
      </Card>

      {/* 最近记录卡片 */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>最近记录</CardTitle>
          <CardDescription>所有问卷最近的打卡记录</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {[
                {
                  date: "2025-05-04",
                  questionnaire: "每日情绪记录",
                  score: 95,
                  status: "已完成",
                },
                {
                  date: "2025-05-04",
                  questionnaire: "每周工作复盘",
                  score: 88,
                  status: "已完成",
                },
                {
                  date: "2025-05-03",
                  questionnaire: "健身习惯追踪",
                  score: 92,
                  status: "已完成",
                },
                {
                  date: "2025-05-03",
                  questionnaire: "每日情绪记录",
                  score: 85,
                  status: "已完成",
                },
                {
                  date: "2025-05-02",
                  questionnaire: "每周工作复盘",
                  score: 90,
                  status: "已完成",
                },
              ].map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <div className="font-medium">{record.questionnaire}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.date} · {record.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">{record.score}分</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}