"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, MoreVertical, UserPlus } from "lucide-react";

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com",
    avatar: "https://github.com/shadcn.png",
    status: "active",
    role: "user",
    registeredDate: "2024-01-15",
    lastLogin: "2025-05-05 10:30",
    completionRate: 85,
  },
  {
    id: 2,
    name: "李四",
    email: "lisi@example.com",
    avatar: "https://github.com/shadcn.png",
    status: "inactive",
    role: "user",
    registeredDate: "2024-02-20",
    lastLogin: "2025-05-04 15:45",
    completionRate: 92,
  },
  {
    id: 3,
    name: "王五",
    email: "wangwu@example.com",
    avatar: "https://github.com/shadcn.png",
    status: "active",
    role: "admin",
    registeredDate: "2024-03-10",
    lastLogin: "2025-05-05 09:15",
    completionRate: 78,
  },
];

export function UserManagementDemo() {
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      {/* 用户列表卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>用户管理</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="搜索用户..."
                className="w-[300px]"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              添加用户
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>注册日期</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>打卡率</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? '活跃' : '非活跃'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                      {user.role === 'admin' ? '管理员' : '用户'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.registeredDate}</TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>{user.completionRate}%</TableCell>
                  <TableCell>
                    <Dialog open={showUserDialog && selectedUser?.id === user.id}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDialog(true);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[800px]">
                        <DialogHeader>
                          <DialogTitle>用户详情</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="info">
                          <TabsList>
                            <TabsTrigger value="info">基本信息</TabsTrigger>
                            <TabsTrigger value="stats">打卡统计</TabsTrigger>
                            <TabsTrigger value="history">历史记录</TabsTrigger>
                          </TabsList>
                          <TabsContent value="info" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>用户名</Label>
                                <Input value={user.name} readOnly />
                              </div>
                              <div className="space-y-2">
                                <Label>邮箱</Label>
                                <Input value={user.email} readOnly />
                              </div>
                              <div className="space-y-2">
                                <Label>注册日期</Label>
                                <Input value={user.registeredDate} readOnly />
                              </div>
                              <div className="space-y-2">
                                <Label>最后登录</Label>
                                <Input value={user.lastLogin} readOnly />
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="stats">
                            <div className="grid grid-cols-3 gap-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle>总打卡天数</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">156天</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader>
                                  <CardTitle>当前连续</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">7天</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader>
                                  <CardTitle>完成率</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{user.completionRate}%</div>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                          <TabsContent value="history">
                            <ScrollArea className="h-[300px]">
                              <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                                    <div>
                                      <div className="font-medium">2025-05-{5 - i}</div>
                                      <div className="text-sm text-muted-foreground">完成度: 100%</div>
                                    </div>
                                    <Badge>已完成</Badge>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
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