import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Target, PiggyBank, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Habitly
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            让坚持成为习惯
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            智能习惯管理平台，通过个性化问卷、奖励机制和数据分析，帮助你轻松养成好习惯
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/register">立即开始</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6"
            >
              <Link href="/login">已有账户</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
          <p className="text-xl text-muted-foreground">
            三大核心功能，让习惯养成更简单
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">智能打卡</CardTitle>
              <CardDescription>
                个性化问卷设计，记录你的每日习惯完成情况
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 自定义问卷模板</li>
                <li>• 多种题型支持</li>
                <li>• 智能提醒系统</li>
                <li>• 补卡机制</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">问卷配置</CardTitle>
              <CardDescription>
                灵活的问卷设计，适应不同的习惯目标
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 单选多选题型</li>
                <li>• 评分量表</li>
                <li>• 自定义分数规则</li>
                <li>• 实时预览</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <PiggyBank className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">小金库管理</CardTitle>
              <CardDescription>
                设置目标金额，通过坚持获得奖励
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 设置目标金额</li>
                <li>• 打卡获得奖励</li>
                <li>• 奖励支取管理</li>
                <li>• 资金变动记录</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">如何使用</h2>
          <p className="text-xl text-muted-foreground">
            三步开始你的习惯养成之旅
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">创建问卷</h3>
            <p className="text-muted-foreground">
              根据你的习惯目标，设计个性化的打卡问卷
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">每日打卡</h3>
            <p className="text-muted-foreground">
              完成问卷答题，记录习惯执行情况并获得奖励
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">查看数据</h3>
            <p className="text-muted-foreground">
              分析打卡数据，调整策略，持续改进习惯
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            开始你的习惯养成之旅
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            加入千万用户，让坚持成为习惯
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/register">免费注册</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 Habitly. 让坚持成为习惯。</p>
        </div>
      </footer>
    </div>
  );
}
