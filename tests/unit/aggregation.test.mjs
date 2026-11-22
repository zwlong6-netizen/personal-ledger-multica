import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase } from '../../src/server/db.mjs';
import { CategoryService } from '../../src/server/categoryService.mjs';
import { TransactionService } from '../../src/server/transactionService.mjs';

test('4. 报表聚合与明细对齐严格校验 (Report Aggregation Consistency Tests)', async (t) => {
  const db = initDatabase(':memory:');
  const catService = new CategoryService(db);
  const txService = new TransactionService(db, catService);

  // 插入一批测试流水数据 (2026-11)
  txService.create({ type: 'EXPENSE', amount: '120.50', categoryId: 'cat_exp_food', transactionTime: '2026-11-05T04:00:00Z' });
  txService.create({ type: 'EXPENSE', amount: '80.00', categoryId: 'cat_exp_traffic', transactionTime: '2026-11-10T08:00:00Z' });
  txService.create({ type: 'EXPENSE', amount: '350.25', categoryId: 'cat_exp_food', transactionTime: '2026-11-20T12:00:00Z' });
  txService.create({ type: 'INCOME', amount: '10000.00', categoryId: 'cat_inc_salary', transactionTime: '2026-11-15T02:00:00Z' });
  txService.create({ type: 'INCOME', amount: '888.88', categoryId: 'cat_inc_bonus', transactionTime: '2026-11-25T06:00:00Z' });

  // 跨月干扰项 (2026-10 与 2026-12)
  txService.create({ type: 'EXPENSE', amount: '999.00', categoryId: 'cat_exp_food', transactionTime: '2026-10-31T00:00:00Z' });
  txService.create({ type: 'INCOME', amount: '500.00', categoryId: 'cat_inc_other', transactionTime: '2026-12-01T08:00:00Z' });

  await t.test('TC-AGG-001: 汇总指标与筛选出的明细单项求和严格一致', () => {
    const overview = txService.getMonthOverview('2026-11', 'Asia/Shanghai');
    const txList = txService.list({ month: '2026-11', pageSize: 100, timezone: 'Asia/Shanghai' });

    let manualExpenseCents = 0n;
    let manualIncomeCents = 0n;
    for (const item of txList.items) {
      if (item.type === 'EXPENSE') manualExpenseCents += BigInt(item.amountCents);
      if (item.type === 'INCOME') manualIncomeCents += BigInt(item.amountCents);
    }

    assert.equal(overview.totalExpenseCents, Number(manualExpenseCents));
    assert.equal(overview.totalIncomeCents, Number(manualIncomeCents));
    assert.equal(overview.balanceCents, Number(manualIncomeCents - manualExpenseCents));
    assert.equal(overview.transactionCount, txList.items.length);
  });

  await t.test('TC-AGG-002: 分类支出占比各项求和严格对齐月度总支出', () => {
    const overview = txService.getMonthOverview('2026-11', 'Asia/Shanghai');
    const dist = txService.getCategoryDistribution('2026-11', 'EXPENSE', 'Asia/Shanghai');

    let sumDistCents = 0n;
    let sumPercentage = 0;
    for (const item of dist.items) {
      sumDistCents += BigInt(item.amountCents);
      sumPercentage += item.percentage;
    }

    assert.equal(Number(sumDistCents), overview.totalExpenseCents);
    assert.equal(dist.totalAmountCents, overview.totalExpenseCents);
    assert.ok(Math.abs(sumPercentage - 1.0) < 0.001); // 百分比之和约为 1.0000
  });

  await t.test('TC-AGG-003: 每日日趋势累加与月度总和严格一致', () => {
    const overview = txService.getMonthOverview('2026-11', 'Asia/Shanghai');
    const trend = txService.getDailyTrend('2026-11', 'Asia/Shanghai');

    assert.equal(trend.days.length, 30); // 11月有30天

    let sumTrendExp = 0n;
    let sumTrendInc = 0n;
    for (const day of trend.days) {
      sumTrendExp += BigInt(day.expenseCents);
      sumTrendInc += BigInt(day.incomeCents);
    }

    assert.equal(Number(sumTrendExp), overview.totalExpenseCents);
    assert.equal(Number(sumTrendInc), overview.totalIncomeCents);
  });
});
