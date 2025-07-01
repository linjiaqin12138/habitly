/* eslint-disable @typescript-eslint/no-explicit-any */
// Logger模块 - 支持分级日志输出和环境自适应格式化

// 日志级别定义
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  ERROR = 3,
  FATAL = 4,
}

// 日志级别映射
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

// 获取当前环境配置的日志级别
function getConfiguredLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  switch (level) {
    case 'TRACE': return LogLevel.TRACE;
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'ERROR': return LogLevel.ERROR;
    case 'FATAL': return LogLevel.FATAL;
    default: return LogLevel.ERROR; // 默认ERROR级别
  }
}

// 判断是否为生产环境
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// 获取系统信息（生产环境JSON格式需要）
function getSystemInfo() {
  if (typeof window !== 'undefined') {
    // 浏览器环境
    return {
      hostname: window.location.hostname,
      pid: 0, // 浏览器环境没有进程ID
    };
  } else {
    // Node.js环境
    return {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      hostname: require('os').hostname(),
      pid: process.pid,
    };
  }
}

// Logger接口定义
export interface Logger {
  trace(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
}

// Logger实现类
class LoggerImpl implements Logger {
  private name: string;
  private configuredLevel: LogLevel;

  constructor(name: string) {
    this.name = name;
    this.configuredLevel = getConfiguredLogLevel();
  }

  // 检查是否应该输出该级别的日志
  private shouldLog(level: LogLevel): boolean {
    return level >= this.configuredLevel;
  }

  // 开发环境格式化输出
  private formatDev(level: LogLevel, message: string, args: any[]): void {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    const prefix = `[${timestamp}] [${levelName}] [${this.name}]`;
    
    // 使用console的内置颜色样式
    switch (level) {
      case LogLevel.TRACE:
        console.log(`%c${prefix} ${message}`, 'color: gray', ...args);
        break;
      case LogLevel.DEBUG:
        console.log(`%c${prefix} ${message}`, 'color: cyan', ...args);
        break;
      case LogLevel.INFO:
        console.log(`%c${prefix} ${message}`, 'color: blue', ...args);
        break;
      case LogLevel.ERROR:
        console.log(`%c${prefix} ${message}`, 'color: red', ...args);
        break;
      case LogLevel.FATAL:
        console.log(`%c${prefix} ${message}`, 'color: white; background-color: red; font-weight: bold', ...args);
        break;
    }
  }

  // 生产环境JSON格式输出
  private formatProd(level: LogLevel, message: string, args: any[]): void {
    const systemInfo = getSystemInfo();
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      name: this.name,
      message,
      args: args.length > 0 ? args : undefined,
      ...systemInfo,
    };
    
    console.log(JSON.stringify(logEntry));
  }

  // 统一的日志输出方法
  private log(level: LogLevel, message: string, args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    if (isProduction()) {
      this.formatProd(level, message, args);
    } else {
      this.formatDev(level, message, args);
    }
  }

  trace(message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, message, args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, args);
  }

  fatal(message: string, ...args: any[]): void {
    this.log(LogLevel.FATAL, message, args);
  }
}

// Logger实例缓存
const loggerCache = new Map<string, Logger>();

// getLogger工厂方法
export function getLogger(name: string): Logger {
  if (!loggerCache.has(name)) {
    loggerCache.set(name, new LoggerImpl(name));
  }
  return loggerCache.get(name)!;
}

// 默认导出
export default { getLogger, LogLevel };