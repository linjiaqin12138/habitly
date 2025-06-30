"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 模拟打卡计划数据
const questionnaires = [
  {
    id: "qnr1",
    title: "每日情绪记录",
    description: "记录你的心情变化和情绪状态",
    status: "active",
    createdAt: "2024-07-20",
    questionCount: 5,
  },
  {
    id: "qnr2",
    title: "每周工作复盘",
    description: "回顾本周工作，总结经验教训",
    status: "active",
    createdAt: "2024-07-18",
    questionCount: 8,
  },
  {
    id: "qnr3",
    title: "健身习惯追踪",
    description: "记录每日健身项目和时长",
    status: "draft",
    createdAt: "2024-07-15",
    questionCount: 4,
  },
  {
    id: "qnr4",
    title: "阅读打卡计划",
    description: "记录阅读书籍和页数",
    status: "archived",
    createdAt: "2024-06-30",
    questionCount: 3,
  },
];

export function QuestionnaireListDemo() {
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">打划列表</CardTitle>
            <CardDescription>管理你的所有打卡计划模板</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              新建打卡计划
            </span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="hidden md:table-cell">问题数</TableHead>
                <TableHead className="hidden md:table-cell">创建日期</TableHead>
                <TableHead>
                  <span className="sr-only">操作</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.title}</TableCell>
                  <TableCell>
                    <Badge variant={
                      q.status === 'active' ? 'default' :
                      q.status === 'draft' ? 'secondary' : 'outline'
                    }>
                      {q.status === 'active' ? '启用中' : q.status === 'draft' ? '草稿' : '已归档'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{q.questionCount}</TableCell>
                  <TableCell className="hidden md:table-cell">{q.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">切换菜单</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem>编辑</DropdownMenuItem>
                        <DropdownMenuItem>预览</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
