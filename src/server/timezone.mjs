/**
 * 时区与自然月边界计算核心工具
 * 严格对齐客户端时区（默认 Asia/Shanghai）与自然月毫秒切分
 */

/**
 * 判断某年是否为闰年 (Leap Year)
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 获取某年某月的总天数
 * @param {number} year
 * @param {number} month 1-12
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * 获取时区的 UTC 偏移分钟数（针对某个时间点）
 * @param {string} timezone 例如 'Asia/Shanghai'
 * @param {Date} date
 * @returns {number} 偏移分钟数，例如 UTC+8 为 480
 */
export function getTimezoneOffsetMinutes(timezone, date = new Date()) {
  try {
    const tzDateStr = date.toLocaleString('en-US', { timeZone: timezone });
    const tzDate = new Date(tzDateStr);
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  } catch (err) {
    // 默认降级为 Asia/Shanghai (+8 小时 = 480 分钟)
    return 480;
  }
}

/**
 * 计算指定月份与时区的自然月起止 UTC 时间范围（精确到毫秒）
 * @param {string} monthStr "YYYY-MM" (如 "2026-11")
 * @param {string} timezone IANA 时区字符串 (如 "Asia/Shanghai")
 * @returns {{ startUtc: Date, endUtc: Date, startIso: string, endIso: string, daysInMonth: number }}
 */
export function getMonthUtcBoundary(monthStr, timezone = 'Asia/Shanghai') {
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
  if (!match) {
    throw new Error('Invalid month format, expected YYYY-MM');
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) {
    throw new Error('Invalid month value, must be 01-12');
  }

  const days = getDaysInMonth(year, month);

  // 月初本地时间: YYYY-MM-01 00:00:00.000
  // 月末本地时间: YYYY-MM-DD 23:59:59.999
  const offsetMinutes = getTimezoneOffsetMinutes(timezone, new Date(Date.UTC(year, month - 1, 1)));

  // UTC = Local - Offset
  const startUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - offsetMinutes * 60000;
  const endUtcMs = Date.UTC(year, month - 1, days, 23, 59, 59, 999) - offsetMinutes * 60000;

  const startUtc = new Date(startUtcMs);
  const endUtc = new Date(endUtcMs);

  return {
    startUtc,
    endUtc,
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
    daysInMonth: days,
    year,
    month,
  };
}

/**
 * 将 UTC Date 根据时区格式化为本地 YYYY-MM-DD
 * @param {Date|string} date
 * @param {string} timezone
 * @returns {string} "YYYY-MM-DD"
 */
export function formatLocalDate(date, timezone = 'Asia/Shanghai') {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${day}`;
}
