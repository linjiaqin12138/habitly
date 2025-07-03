// 服务初始化模块 - 确保定时任务只启动一次
import { startCheckinReminderService } from './checkinService';
import { getLogger } from '../logger';

const logger = getLogger('serviceInitializer');

// 全局标志，确保只初始化一次
let isInitialized = false;

/**
 * 初始化所有后台服务
 * 只在第一次调用时执行，后续调用会被忽略
 */
export function initializeServices(): void {
  if (isInitialized) {
    return;
  }

  try {
    logger.info('开始初始化后台服务');
    
    // 启动打卡提醒定时任务
    startCheckinReminderService();
    
    isInitialized = true;
    logger.info('后台服务初始化完成');
  } catch (error) {
    logger.error('后台服务初始化失败:', error);
    // 不抛出异常，避免影响API正常响应
  }
}