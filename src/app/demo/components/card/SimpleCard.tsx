import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function SimpleCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>打卡任务</CardTitle>
        <CardDescription>每日任务打卡示例</CardDescription>
      </CardHeader>
      <CardContent>
        <p>今日待完成任务：</p>
        <ul className="list-disc pl-6 mt-2">
          <li>晨跑 30 分钟</li>
          <li>冥想 15 分钟</li>
          <li>读书 1 小时</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button>完成打卡</Button>
      </CardFooter>
    </Card>
  );
}