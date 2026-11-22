import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../src/server/index.mjs';

test('5. 核心冒烟与全链路测试 (End-to-End Smoke Test Suite)', async (t) => {
  const { server, db, categoryService, transactionService } = createApp(':memory:');

  // 启动本地测试临时 HTTP Server
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  await t.test('SMOKE-001: 完整业务生命周期 (分类 -> 记账 -> 看板 -> 拦截 -> 删除)', async () => {
    // 1. 健康探针检测
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.data.database, 'connected');

    // 2. 创建自定义分类
    const createCatRes = await fetch(`${baseUrl}/api/v1/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '数码外设',
        type: 'EXPENSE',
        icon: 'Mouse',
        color: '#6366F1',
      }),
    });
    assert.equal(createCatRes.status, 201);
    const newCat = (await createCatRes.json()).data;
    assert.ok(newCat.id);

    // 3. 记录一笔支出与一笔收入
    const createTxRes1 = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'EXPENSE',
        amount: '299.90',
        categoryId: newCat.id,
        transactionTime: '2026-11-22T04:30:00.000Z',
        note: '机械键盘',
      }),
    });
    assert.equal(createTxRes1.status, 201);
    const tx1 = (await createTxRes1.json()).data;
    assert.equal(tx1.amountCents, 29990);

    const createTxRes2 = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'INCOME',
        amount: '5000.00',
        categoryId: 'cat_inc_salary',
        transactionTime: '2026-11-22T05:00:00.000Z',
        note: '工资',
      }),
    });
    assert.equal(createTxRes2.status, 201);

    // 4. 查询月度概览与流水列表
    const overviewRes = await fetch(`${baseUrl}/api/v1/stats/overview?month=2026-11`);
    assert.equal(overviewRes.status, 200);
    const overview = (await overviewRes.json()).data;
    assert.equal(overview.totalExpense, 299.9);
    assert.equal(overview.totalIncome, 5000);
    assert.equal(overview.balance, 4700.1);
    assert.equal(overview.transactionCount, 2);

    // 5. 测试分类删除拦截保护
    const delCatFail = await fetch(`${baseUrl}/api/v1/categories/${newCat.id}`, { method: 'DELETE' });
    assert.equal(delCatFail.status, 409);
    const delFailJson = await delCatFail.json();
    assert.equal(delFailJson.error.code, 'CATEGORY_IN_USE');

    // 6. 删除关联流水后，成功删除该分类
    const delTxRes = await fetch(`${baseUrl}/api/v1/transactions/${tx1.id}`, { method: 'DELETE' });
    assert.equal(delTxRes.status, 200);

    const delCatSuccess = await fetch(`${baseUrl}/api/v1/categories/${newCat.id}`, { method: 'DELETE' });
    assert.equal(delCatSuccess.status, 200);

    // 7. 静态首页 SPA 可访问性
    const spaRes = await fetch(`${baseUrl}/`);
    assert.equal(spaRes.status, 200);
    const spaHtml = await spaRes.text();
    assert.ok(spaHtml.includes('个人记账本'));
  });
});
