import { notFound } from "next/navigation";
import { AuthDemo } from "../components/auth/AuthDemo";
import { SimpleCard } from "../components/card/SimpleCard";
import { DashboardDemo } from "../components/dashboard/DashboardDemo";
import { CheckinDemo } from "../components/checkin/CheckinDemo";
import { MakeupCheckinDemo } from "../components/makeup/MakeupCheckinDemo";
import { HistoryDemo } from "../components/history/HistoryDemo";
import { SettingsDemo } from "../components/settings/SettingsDemo";
import { BalanceDemo } from "../components/settings/BalanceDemo";
import { QuestionnaireDemo } from "../components/questionnaire/QuestionnaireDemo";
import { QuestionnaireEmoDemo } from "../components/questionnaire/QuestionnaireEmoDemo";
import { QuestionnaireListDemo } from "../components/questionnaire/QuestionnaireListDemo"; // 新增导入
import { UserManagementDemo } from "../components/user/UserManagementDemo"; // 新增导入

// 定义可用的演示页面
const demoPages = {
  "auth": {
    title: "用户认证界面",
    description: "现代化的登录、注册和找回密码界面",
    component: AuthDemo
  },
  "dashboard": {
    title: "用户仪表盘",
    description: "展示用户的打卡状态、统计数据和账户信息",
    component: DashboardDemo
  },
  "checkin": {
    title: "每日打卡",
    description: "支持多种题型的打卡问卷界面",
    component: CheckinDemo
  },
  "makeup": {
    title: "补救打卡",
    description: "错过打卡后的补救机制，需要手动输入文字说明",
    component: MakeupCheckinDemo
  },
  "history": {
    title: "历史记录",
    description: "查看打卡历史、统计数据和趋势分析",
    component: HistoryDemo
  },
  "simple-card": {
    title: "打卡卡片演示",
    description: "展示基础的卡片布局",
    component: SimpleCard
  },
  "settings": {
    title: "个人设置",
    description: "个人信息编辑、头像上传和通知设置",
    component: SettingsDemo
  },
  "balance": {
    title: "余额管理",
    description: "余额查看、充值、提现和交易记录",
    component: BalanceDemo
  },
  "questionnaire": {
    title: "问卷编辑器",
    description: "创建和编辑打卡问卷模板",
    component: QuestionnaireDemo
  },
  "questionnairev2": {
    title: "问卷编辑器v2",
    description: "创建和编辑打卡问卷模板V2", // survery.js 版本太久，无法与最新react兼容
    component: QuestionnaireEmoDemo
  },
  "questionnaire-list": { // 新增问卷列表 demo
    title: "问卷列表",
    description: "展示和管理所有问卷模板",
    component: QuestionnaireListDemo
  },
  "user-management": { // 新增用户管理 demo
    title: "用户管理",
    description: "管理系统用户、查看用户详情和数据统计",
    component: UserManagementDemo
  }
};

export default function DemoPage({ params }: { params: { page: string } }) {
  const demo = demoPages[params.page as keyof typeof demoPages];
  
  if (!demo) {
    notFound();
  }

  const Component = demo.component;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-8">{demo.title}</h1>
      <p className="text-gray-500 mb-8">{demo.description}</p>
      <Component />
    </div>
  );
}