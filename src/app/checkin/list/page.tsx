"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { PlusCircle, MoreHorizontal, Loader2, Edit, Trash2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getCheckinProfiles, deleteCheckinProfile, updateCheckinProfile } from "@/lib/api/checkinApi";
import { CheckinProfile } from "@/types/checkin";
import PageLoading from "@/components/pageload";

export default function CheckinListPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<CheckinProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<CheckinProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<boolean>(false);
  // const [_, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCheckinProfiles();
      setProfiles(data.profiles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取打卡配置列表失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/checkin/new');
  };

  const handleEdit = (profile: CheckinProfile) => {
    router.push(`/checkin/edit/${profile.id}`);
  };

  const handleCheckin = (profile: CheckinProfile) => {
    router.push(`/checkin/${profile.id}`);
  };

  const handleDeleteClick = (profile: CheckinProfile) => {
    // 先关闭dropdown
    // setOpenDropdownId(null);
    // 使用setTimeout确保dropdown完全关闭后再打开dialog
    setTimeout(() => {
      setProfileToDelete(profile);
      setDeleteDialogOpen(true);
    }, 50);
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;

    try {
      setDeleting(true);
      await deleteCheckinProfile(profileToDelete.id);
      toast.success('打卡配置已删除');
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
      // 重新加载列表
      await loadProfiles();
   } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除打卡配置失败';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (profile: CheckinProfile) => {
    setToggling(true);
    try {
      await updateCheckinProfile(profile.id, { isActive: !profile.isActive }  )
      toast.success(`打卡配置已${profile.isActive ? '停用' : '启用'}`);
      // 重新加载列表
      await loadProfiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新打卡配置状态失败';
      toast.error(errorMessage);
    } finally {
      setToggling(false);
    }
  };

  // const handleDeleteCancel = () => {
  //   setDeleteDialogOpen(false);
  //   setProfileToDelete(null);
  // };

  const formatFrequency = (frequency: CheckinProfile['frequency']) => {
    switch (frequency.type) {
      case 'daily':
        return '每日';
      case 'weekly':
        return `每周${frequency.weeklyDays?.length || 0}天`;
      case 'custom':
        return `自定义${frequency.customDates?.length || 0}天`;
      default:
        return '未知';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <PageLoading />
    );
  }

  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
      <div className="w-full max-w-[1200px] space-y-6 px-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold mb-2">打卡配置列表</h1>
          <p className="text-gray-500">管理您的所有打卡配置</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-bold">我的打卡配置</CardTitle>
              <CardDescription>创建和管理您的习惯打卡配置</CardDescription>
            </div>
            <Button onClick={handleCreateNew} size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              新建打卡配置
            </Button>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-md">
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadProfiles}
                  className="ml-2"
                >
                  重试
                </Button>
              </div>
            )}

            {profiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <PlusCircle className="h-12 w-12 mx-auto mb-2" />
                </div>
                <p className="text-gray-500 mb-4">还没有打卡配置</p>
                <Button onClick={handleCreateNew}>
                  创建第一个打卡配置
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>频率</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="hidden md:table-cell">创建时间</TableHead>
                    <TableHead>
                      <span className="sr-only">操作</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{profile.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {profile.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatFrequency(profile.frequency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                          {profile.isActive ? '启用中' : '已禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(profile.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckin(profile)}
                            className="gap-1"
                            disabled={!profile.isActive}
                          >
                            <Play className="h-3 w-3" />
                            打卡
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">打开菜单</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>操作</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(profile)}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(profile)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(profile)}
                                className={profile.isActive ? 'text-red-600' : 'text-green-600'}
                              >
                                {toggling ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : profile.isActive ? (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    停用
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    启用
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除打卡配置「{profileToDelete?.title}」吗？
                <br />
                此操作将同时删除所有相关的打卡记录，且无法恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}