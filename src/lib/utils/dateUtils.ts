// 日期工具函数
// 解决时区问题：确保使用本地时区而不是UTC

/**
 * 获取本地日期字符串（YYYY-MM-DD格式）
 * @param date 可选的日期对象，默认为当前时间
 * @returns 本地时区的日期字符串
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取本地年月字符串（YYYY-MM格式）
 * @param date 可选的日期对象，默认为当前时间
 * @returns 本地时区的年月字符串
 */
export function getLocalYearMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 创建本地日期对象（设置为当天的00:00:00）
 * @param dateString YYYY-MM-DD格式的日期字符串
 * @returns 本地时区的日期对象
 */
export function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 比较两个日期是否为同一天（忽略时间）
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 是否为同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return getLocalDateString(date1) === getLocalDateString(date2);
}