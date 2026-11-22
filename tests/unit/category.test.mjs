import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase } from '../../src/server/db.mjs';
import { CategoryService } from '../../src/server/categoryService.mjs';
import { TransactionService } from '../../src/server/transactionService.mjs';

test('3. 分类与交易完整性测试用例集 (Category & Integrity Tests)', async (t) => {
  const db = initDatabase(':memory:');
  const catService = new CategoryService(db);
  const txService = new TransactionService(db, catService);

  await t.test('TC-CAT-001: 系统预置分类删除拦截 (403 Forbidden)', () => {
    assert.throws(
      () => catService.delete('cat_exp_food'),
      (err) => {
        return err.statusCode === 403 && err.code === 'CANNOT_DELETE_DEFAULT_CATEGORY';
      }
    );
  });

  await t.test('TC-CAT-002: 存在关联账单的自定义分类删除拦截 (409 Conflict)', () => {
    // 1. 创建自定义分类
    const customCat = catService.create({
      name: '爱宠猫咪',
      type: 'EXPENSE',
      icon: 'Cat',
      color: '#F472B6',
    });

    // 2. 录入两笔关联账单
    txService.create({
      type: 'EXPENSE',
      amount: '50.00',
      categoryId: customCat.id,
      transactionTime: '2026-11-15T10:00:00.000Z',
      note: '猫粮',
    });
    txService.create({
      type: 'EXPENSE',
      amount: '30.00',
      categoryId: customCat.id,
      transactionTime: '2026-11-16T10:00:00.000Z',
      note: '猫砂',
    });

    // 3. 尝试删除，断言 409 拦截
    assert.throws(
      () => catService.delete(customCat.id),
      (err) => {
        return err.statusCode === 409 && err.code === 'CATEGORY_IN_USE' && err.details.transactionCount === 2;
      }
    );
  });

  await t.test('TC-CAT-003: 无关联的自定义分类成功删除', () => {
    const emptyCat = catService.create({
      name: '临时待删分类',
      type: 'EXPENSE',
      icon: 'Tag',
      color: '#94A3B8',
    });

    const res = catService.delete(emptyCat.id);
    assert.equal(res.deleted, true);
    assert.equal(catService.getById(emptyCat.id), null);
  });

  await t.test('TC-CAT-004: 账单迁移后允许安全删除自定义分类', () => {
    const catA = catService.create({ name: '过渡分类A', type: 'EXPENSE', icon: 'Box', color: '#10B981' });
    const tx = txService.create({
      type: 'EXPENSE',
      amount: '20.00',
      categoryId: catA.id,
      transactionTime: '2026-11-10T10:00:00Z',
    });

    // 迁移交易至预置分类
    txService.update(tx.id, { categoryId: 'cat_exp_other' });

    // 再次删除 catA，成功
    const res = catService.delete(catA.id);
    assert.equal(res.deleted, true);
  });
});
