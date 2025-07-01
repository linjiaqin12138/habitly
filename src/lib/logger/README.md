# Logger模块使用说明

## 基本用法

```typescript
import { getLogger } from '@/lib/logger';

// 创建logger实例
const logger = getLogger('service.auth');

// 使用不同级别的日志
logger.trace('详细跟踪信息');
logger.debug('调试信息', { userId: 123 });
logger.info('一般信息', { action: 'login' });
logger.error('错误信息', error, { context: 'user-login' });
logger.fatal('致命错误', { system: 'database' });
```

## 环境变量配置

在 `.env` 文件中设置日志级别：

```bash
# 设置日志级别 (TRACE, DEBUG, INFO, ERROR, FATAL)
LOG_LEVEL=DEBUG

# 环境配置
NODE_ENV=production  # 生产环境输出JSON格式
NODE_ENV=development # 开发环境输出彩色格式
```

## 输出格式

### 开发环境（彩色格式）
```
[2025-07-01T13:48:00.000Z] [INFO] [service.auth] 用户登录成功 { userId: 123 }
```

### 生产环境（JSON格式）
```json
{"timestamp":"2025-07-01T13:48:00.000Z","level":"INFO","name":"service.auth","message":"用户登录成功","args":[{"userId":123}],"hostname":"server01","pid":1234}
```

## 层级命名示例

```typescript
// 服务层
const authLogger = getLogger('service.auth');
const checkinLogger = getLogger('service.checkin');

// API层
const apiLogger = getLogger('api.vault');
const routeLogger = getLogger('api.checkin.submit');

// 工具层
const dbLogger = getLogger('utils.database');
```