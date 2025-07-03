# 2025-07-03-Supabase Cookie认证机制规范化.md

## 问题背景
在设计消息通知模块和其他API文档时，我总是习惯性地使用JWT Token认证方式，但实际项目使用的是Supabase Cookie认证机制。用户多次指出这个问题，需要将正确的认证方式总结到开发规范中。

## 方案思考
1. **查看现有API实现**：了解实际使用的认证机制
2. **分析认证流程**：理解Cookie认证的工作原理
3. **更新开发规范**：将认证机制规范化，避免后续设计错误

## 代码实现
通过查看现有代码发现：
- 服务端使用`@supabase/ssr`创建客户端
- 通过`cookies()`获取认证信息
- 使用`withAuth`中间件自动处理认证
- 无需手动处理Authorization Header

### 核心认证流程
```typescript
// 1. 服务端获取用户信息
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 2. API中间件自动认证
export function withAuth(handler) {
  return async function (ctx) {
    const user = await getUser();
    if (!user) {
      throw new AppError('UNAUTHORIZED', '用户未登录');
    }
    return handler({ ...ctx, user });
  };
}

// 3. API路由直接使用user
export const GET = withErrorHandling(
  withAuth(async ({ user }) => {
    // 直接使用 user.id，无需解析token
    const result = await getDataByUserId(user.id);
    return NextResponse.json({ result });
  })
);
```

## 关键差异对比
### 错误的Token认证方式
```http
GET /api/vault
Authorization: Bearer {jwt_token}
```

### 正确的Cookie认证方式
```http
GET /api/vault
Cookie: sb-access-token=...; sb-refresh-token=...
# Cookie由浏览器自动发送，无需手动设置
```

## 开发规范更新
在开发规范中新增"认证授权规范"章节，包含：
1. 认证机制说明（Cookie vs Token）
2. API认证中间件使用方法
3. 前端认证状态管理
4. 注意事项和最佳实践

## 遇到的问题与解决方案
1. **问题**：习惯性使用JWT Token设计API
   **解决方案**：在开发规范中明确规定使用Cookie认证

2. **问题**：不了解Supabase SSR的认证机制
   **解决方案**：查看现有代码实现，理解Cookie认证流程

## 下次应该注意什么
1. 设计API文档时，首先查看项目的认证机制
2. 不要假设使用标准的JWT Token认证
3. 遵循项目既定的技术栈和架构模式
4. 及时更新开发规范，避免重复犯错

## 与用户沟通的经验
- 用户对重复犯同样错误感到不耐烦
- 需要将重要的架构决策记录到规范中
- 开发规范是避免设计错误的重要工具
- 要根据实际项目情况调整设计思路