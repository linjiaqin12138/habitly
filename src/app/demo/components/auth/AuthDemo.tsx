import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthDemo() {
  return (
    <Card className="w-[380px] shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">HabitTracker</CardTitle>
        <CardDescription className="text-center">每一个习惯，都是更好的自己</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
            <TabsTrigger value="forgot">找回密码</TabsTrigger>
          </TabsList>
          
          {/* 登录表单 */}
          <TabsContent value="login">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" placeholder="请输入邮箱" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" placeholder="请输入密码" type="password" />
              </div>
              <Button className="w-full mt-6">登录</Button>
            </div>
          </TabsContent>

          {/* 注册表单 */}
          <TabsContent value="register">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reg-email">邮箱</Label>
                <Input id="reg-email" placeholder="请输入邮箱" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input id="username" placeholder="请输入用户名" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">密码</Label>
                <Input id="reg-password" placeholder="请输入密码" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认密码</Label>
                <Input id="confirm-password" placeholder="请再次输入密码" type="password" />
              </div>
              <Button className="w-full mt-6">注册</Button>
            </div>
          </TabsContent>

          {/* 找回密码表单 */}
          <TabsContent value="forgot">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">邮箱</Label>
                <Input id="forgot-email" placeholder="请输入注册邮箱" type="email" />
              </div>
              <Button className="w-full mt-6">发送重置链接</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-gray-500">
        Powered by HabitTracker
      </CardFooter>
    </Card>
  );
}