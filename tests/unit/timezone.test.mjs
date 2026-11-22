import test from 'node:test';
import assert from 'node:assert/strict';
import { getMonthUtcBoundary, formatLocalDate, isLeapYear, getDaysInMonth } from '../../src/server/timezone.mjs';

test('2. 时区与日期边界测试用例集 (Timezone & Date Boundary Tests)', async (t) => {
  await t.test('TC-TIME-001: Asia/Shanghai 2026-11 自然月起止 UTC 毫秒级划分', () => {
    const boundary = getMonthUtcBoundary('2026-11', 'Asia/Shanghai');
    assert.equal(boundary.daysInMonth, 30);
    // 2026-11-01 00:00:00.000 (UTC+8) -> 2026-10-31T16:00:00.000Z
    assert.equal(boundary.startIso, '2026-10-31T16:00:00.000Z');
    // 2026-11-30 23:59:59.999 (UTC+8) -> 2026-11-30T15:59:59.999Z
    assert.equal(boundary.endIso, '2026-11-30T15:59:59.999Z');
  });

  await t.test('TC-TIME-002: 跨月临界账单归属划分', () => {
    // 临界点 A: 11月末最后一毫秒
    const txA = '2026-11-30T15:59:59.999Z';
    // 临界点 B: 12月初第一毫秒
    const txB = '2026-11-30T16:00:00.000Z';

    const bNov = getMonthUtcBoundary('2026-11', 'Asia/Shanghai');
    const bDec = getMonthUtcBoundary('2026-12', 'Asia/Shanghai');

    const txADate = new Date(txA);
    const txBDate = new Date(txB);

    assert.ok(txADate >= bNov.startUtc && txADate <= bNov.endUtc, 'txA must be in Nov');
    assert.ok(!(txBDate >= bNov.startUtc && txBDate <= bNov.endUtc), 'txB must not be in Nov');
    assert.ok(txBDate >= bDec.startUtc && txBDate <= bDec.endUtc, 'txB must be in Dec');
  });

  await t.test('TC-TIME-003: 同一 UTC 时间跨时区独立性', () => {
    const utcTime = '2026-10-31T20:00:00Z';
    const dateBj = formatLocalDate(utcTime, 'Asia/Shanghai');
    const dateNy = formatLocalDate(utcTime, 'America/New_York');

    assert.equal(dateBj, '2026-11-01');
    assert.equal(dateNy, '2026-10-31');
  });

  await t.test('TC-TIME-004: 跨年分界点 2026-12 与 2027-01', () => {
    const bDec = getMonthUtcBoundary('2026-12', 'Asia/Shanghai');
    const bJan = getMonthUtcBoundary('2027-01', 'Asia/Shanghai');

    assert.equal(bDec.endIso, '2026-12-31T15:59:59.999Z');
    assert.equal(bJan.startIso, '2026-12-31T16:00:00.000Z');
  });

  await t.test('TC-TIME-005: 闰年与平年 2 月天数计算', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2026), false);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(1900), false);

    assert.equal(getDaysInMonth(2024, 2), 29);
    assert.equal(getDaysInMonth(2026, 2), 28);
  });

  await t.test('TC-TIME-006: 闰年 2024-02 包含 29 天自然边界', () => {
    const bFeb = getMonthUtcBoundary('2024-02', 'Asia/Shanghai');
    assert.equal(bFeb.daysInMonth, 29);
    assert.equal(bFeb.endIso, '2024-02-29T15:59:59.999Z');
  });
});
