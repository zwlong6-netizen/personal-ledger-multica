/**
 * 金额计算与防浮点误差核心工具库
 * 底层存储以“分”（Cent，整型 BigInt）为最小原子单位
 */

export const MAX_AMOUNT_CENTS = 99999999999n; // 999,999,999.99 元
export const MIN_AMOUNT_CENTS = 1n;            // 0.01 元

/**
 * 将元（数字或字符串）精确转换为分 (BigInt)
 * @param {number|string} amount
 * @returns {bigint}
 */
export function parseToCents(amount) {
  if (amount === undefined || amount === null) {
    throw new Error('Amount is required');
  }

  let str = String(amount).trim();
  if (!str) {
    throw new Error('Amount cannot be empty');
  }

  // 严格正则：最多2位小数的正数，支持可选的前导0或整数
  const regex = /^([1-9]\d*|0)(\.\d{1,2})?$/;
  if (!regex.test(str)) {
    throw new Error('Invalid currency amount format. Must be a positive number with at most 2 decimal places');
  }

  const parts = str.split('.');
  const whole = BigInt(parts[0]);
  let fractionStr = parts[1] || '0';
  if (fractionStr.length === 1) {
    fractionStr += '0';
  } else if (fractionStr.length > 2) {
    throw new Error('Invalid currency amount format');
  }
  const fraction = BigInt(fractionStr);

  const cents = whole * 100n + fraction;

  if (cents < MIN_AMOUNT_CENTS || cents > MAX_AMOUNT_CENTS) {
    throw new Error('Amount out of bounds. Must be between 0.01 and 999,999,999.99');
  }

  return cents;
}

/**
 * 将分 (BigInt 或 Number) 格式化为两位小数字符串 (例如 "48.50")
 * @param {bigint|number} cents
 * @returns {string}
 */
export function centsToAmountString(cents) {
  const isNegative = BigInt(cents) < 0n;
  const absCents = isNegative ? -BigInt(cents) : BigInt(cents);
  const whole = absCents / 100n;
  const fraction = absCents % 100n;
  const fracStr = fraction < 10n ? `0${fraction}` : `${fraction}`;
  return `${isNegative ? '-' : ''}${whole}.${fracStr}`;
}

/**
 * 将分格式化为标准浮点数字（仅用于 JSON 兼容响应字段）
 * @param {bigint|number} cents
 * @returns {number}
 */
export function centsToAmountNumber(cents) {
  return Number(centsToAmountString(cents));
}

/**
 * 格式化为人民币展示格式 (如 "¥48.50" 或 "-¥150.50")
 * @param {bigint|number} cents
 * @returns {string}
 */
export function formatCurrency(cents) {
  const num = Number(cents) / 100;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
