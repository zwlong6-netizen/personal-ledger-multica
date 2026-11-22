import test from 'node:test';
import assert from 'node:assert/strict';
import { parseToCents, centsToAmountString, centsToAmountNumber, formatCurrency } from '../../src/server/currency.mjs';

test('1. 核心金额计算与精度测试用例集 (Currency & Precision Tests)', async (t) => {
  await t.test('TC-CURR-001: 最小有效金额 0.01 元换算为 1n 分', () => {
    const cents = parseToCents('0.01');
    assert.equal(cents, 1n);
    assert.equal(centsToAmountString(cents), '0.01');
    assert.equal(formatCurrency(cents), '¥0.01');
  });

  await t.test('TC-CURR-002: 业务上限金额 999,999,999.99 元安全换算', () => {
    const cents = parseToCents('999999999.99');
    assert.equal(cents, 99999999999n);
    assert.equal(centsToAmountString(cents), '999999999.99');
  });

  await t.test('TC-CURR-003: 非法零元与负数拦截', () => {
    assert.throws(() => parseToCents('0'), /Amount out of bounds/);
    assert.throws(() => parseToCents('0.00'), /Amount out of bounds/);
    assert.throws(() => parseToCents('-10.50'), /Invalid currency amount format/);
  });

  await t.test('TC-CURR-004: 超过上限拦截', () => {
    assert.throws(() => parseToCents('1000000000.00'), /Amount out of bounds/);
  });

  await t.test('TC-CURR-005: 超过2位小数拦截', () => {
    assert.throws(() => parseToCents('10.005'), /Invalid currency amount format/);
    assert.throws(() => parseToCents('12.3456'), /Invalid currency amount format/);
  });

  await t.test('TC-CURR-006: 经典浮点数防偏差 (0.10 + 0.20 精确等于 0.30)', () => {
    const c1 = parseToCents('0.10');
    const c2 = parseToCents('0.20');
    const totalCents = c1 + c2;
    assert.equal(totalCents, 30n);
    assert.equal(centsToAmountString(totalCents), '0.30');
    assert.notEqual(0.1 + 0.2, 0.3); // 证明 JS 原生浮点存在精度偏差
  });

  await t.test('TC-CURR-007: 大批量微小金额累加 (10,000次 0.01元)', () => {
    let sum = 0n;
    const oneCent = parseToCents('0.01');
    for (let i = 0; i < 10000; i++) {
      sum += oneCent;
    }
    assert.equal(sum, 10000n);
    assert.equal(centsToAmountString(sum), '100.00');
  });

  await t.test('TC-CURR-008: 随机多笔零头金额累加无舍入偏差', () => {
    const list = ['12.34', '56.78', '99.01', '0.05', '100.82'];
    let sum = 0n;
    for (const item of list) {
      sum += parseToCents(item);
    }
    assert.equal(sum, 26900n);
    assert.equal(centsToAmountString(sum), '269.00');
  });

  await t.test('TC-CURR-009: 负结余正确展示与标记', () => {
    const income = parseToCents('100.00');
    const expense = parseToCents('250.50');
    const balanceCents = income - expense;
    assert.equal(balanceCents, -15050n);
    assert.equal(centsToAmountString(balanceCents), '-150.50');
    assert.equal(centsToAmountNumber(balanceCents), -150.5);
  });
});
