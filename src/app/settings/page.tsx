"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile, UserNotifications } from "@/types/settings";
import * as settingsService from "@/lib/services/settings";
import { toast } from "sonner";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [notifications, setNotifications] = useState<Partial<UserNotifications>>({});

    useEffect(() => {
        loadUserData();
    }, []);

    async function loadUserData() {
        try {
            const [profileData, notificationsData] = await Promise.all([
                settingsService.getUserProfile(),
                settingsService.getUserNotifications()
            ]);
            setProfile(profileData || {});
            setNotifications(notificationsData || {});
        } catch (error) {
            toast("加载失败");
        }
    }

    async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files?.length) return;

        setIsLoading(true);
        try {
            const file = event.target.files[0];
            const avatarUrl = await settingsService.uploadAvatar(file);
            await settingsService.updateUserProfile({ ...profile, avatarUrl });
            setProfile(prev => ({ ...prev, avatarUrl }));
            toast("头像更新成功");
        } catch (error) {
            toast("上传失败");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        setIsLoading(true);
        try {
            await Promise.all([
                settingsService.updateUserProfile(profile),
                settingsService.updateUserNotifications(notifications)
            ]);
            toast("保存成功");
        } catch (error) {
            toast('保存失败');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full max-w-[1200px] space-y-6 p-4 mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <div className="flex flex-col items-center space-y-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={profile.avatarUrl || ""} />
                                <AvatarFallback>头像</AvatarFallback>
                            </Avatar>
                            <div>
                                <Input
                                    type="file"
                                    id="avatar"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isLoading}
                                />
                                <Button variant="outline" size="sm" asChild>
                                    <label htmlFor="avatar" className="cursor-pointer">
                                        更换头像
                                    </label>
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">昵称</Label>
                                <Input
                                    id="name"
                                    value={profile.displayName || ""}
                                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                                    className="col-span-3"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">邮箱</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profile.email || ""}
                                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                    className="col-span-3"
                                    disabled={true}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">手机号</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={profile.phone || ""}
                                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                    className="col-span-3"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>通知设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications">邮件通知</Label>
                        <Switch
                            id="emailNotifications"
                            checked={notifications.emailNotifications}
                            onCheckedChange={(checked) =>
                                setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                            }
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="pushNotifications">推送通知</Label>
                        <Switch
                            id="pushNotifications"
                            checked={notifications.pushNotifications}
                            onCheckedChange={(checked) =>
                                setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                            }
                            disabled={isLoading}
                        />
                    </div>
                    {notifications.pushNotifications && (
                        <div className="grid grid-cols-4 items-center gap-4 mt-4">
                            <Label htmlFor="pushToken" className="text-right">推送Token</Label>
                            <Input
                                id="pushToken"
                                value={notifications.pushToken || ""}
                                onChange={(e) => setNotifications(prev => ({ ...prev, pushToken: e.target.value }))}
                                className="col-span-3"
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? "保存中..." : "保存更改"}
                </Button>
            </div>
        </div>
    );
}