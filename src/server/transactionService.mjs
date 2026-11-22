/**
 * 记账流水与统计报表服务 (Transaction & Stats Service)
 */

import { randomUUID } from 'node:crypto';
import { parseToCents, centsToAmountNumber, centsToAmountString } from './currency.mjs';
import { getMonthUtcBoundary, formatLocalDate } from './timezone.mjs';

export class TransactionService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./categoryService.mjs').CategoryService} categoryService
   */
  constructor(db, categoryService) {
    this.db = db;
    this.categoryService = categoryService;
  }

  /**
   * 创建一条记账流水
   * @param {{ type: 'EXPENSE'|'INCOME', amount: number|string, categoryId: string, transactionTime: string, note?: string }} param0
   */
  create({ type, amount, categoryId, transactionTime, note = '' }) {
    if (!['EXPENSE', 'INCOME'].includes(type)) {
      const err = new Error("Transaction type must be 'EXPENSE' or 'INCOME'");
      err.statusCode = 400;
      throw err;
    }

    const amountCents = parseToCents(amount);
    const amountVal = centsToAmountNumber(amountCents);

    const category = this.categoryService.getById(categoryId);
    if (!category) {
      const err = new Error(`Category ${categoryId} does not exist`);
      err.statusCode = 400;
      throw err;
    }

    if (category.type !== type) {
      const err = new Error(`Category type (${category.type}) does not match transaction type (${type})`);
      err.statusCode = 400;
      throw err;
    }

    const txDate = new Date(transactionTime);
    if (isNaN(txDate.getTime())) {
      const err = new Error('Invalid transactionTime format');
      err.statusCode = 400;
      throw err;
    }
    const isoTxTime = txDate.toISOString();

    const noteStr = typeof note === 'string' ? note.trim().slice(0, 255) : '';
    const id = `tx_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO transactions (id, amount_cents, amount, type, category_id, transaction_time, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, Number(amountCents), amountVal, type, categoryId, isoTxTime, noteStr, now, now);

    return this.getById(id);
  }

  /**
   * 获取单笔流水详情
   * @param {string} id
   */
  getById(id) {
    const row = this.db.prepare(`
      SELECT 
        t.id, t.amount_cents as amountCents, t.amount, t.type,
        t.category_id as categoryId, t.transaction_time as transactionTime,
        t.note, t.created_at as createdAt, t.updated_at as updatedAt,
        c.name as cat_name, c.icon as cat_icon, c.color as cat_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);

    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      amountCents: Number(row.amountCents),
      categoryId: row.categoryId,
      category: {
        id: row.categoryId,
        name: row.cat_name,
        icon: row.cat_icon,
        color: row.cat_color,
      },
      transactionTime: row.transactionTime,
      note: row.note || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * 更新单笔流水
   * @param {string} id
   * @param {{ type?: 'EXPENSE'|'INCOME', amount?: number|string, categoryId?: string, transactionTime?: string, note?: string }} param1
   */
  update(id, { type, amount, categoryId, transactionTime, note }) {
    const existing = this.getById(id);
    if (!existing) {
      const err = new Error(`Transaction ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const newType = type || existing.type;
    let newAmountCents = BigInt(existing.amountCents);
    let newAmount = existing.amount;
    if (amount !== undefined) {
      newAmountCents = parseToCents(amount);
      newAmount = centsToAmountNumber(newAmountCents);
    }

    const newCatId = categoryId || existing.categoryId;
    const cat = this.categoryService.getById(newCatId);
    if (!cat) {
      const err = new Error(`Category ${newCatId} not found`);
      err.statusCode = 400;
      throw err;
    }
    if (cat.type !== newType) {
      const err = new Error(`Category type (${cat.type}) does not match transaction type (${newType})`);
      err.statusCode = 400;
      throw err;
    }

    let newTxTime = existing.transactionTime;
    if (transactionTime !== undefined) {
      const d = new Date(transactionTime);
      if (isNaN(d.getTime())) {
        const err = new Error('Invalid transactionTime format');
        err.statusCode = 400;
        throw err;
      }
      newTxTime = d.toISOString();
    }

    const newNote = note !== undefined ? (note || '').trim().slice(0, 255) : existing.note;
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE transactions
      SET amount_cents = ?, amount = ?, type = ?, category_id = ?, transaction_time = ?, note = ?, updated_at = ?
      WHERE id = ?
    `).run(Number(newAmountCents), newAmount, newType, newCatId, newTxTime, newNote, now, id);

    return this.getById(id);
  }

  /**
   * 删除单笔流水
   * @param {string} id
   */
  delete(id) {
    const existing = this.getById(id);
    if (!existing) {
      const err = new Error(`Transaction ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return {
      id,
      deleted: true,
    };
  }

  /**
   * 分页与按月查询交易列表，并返回当月汇总数据
   */
  list({ month, type, categoryId, page = 1, pageSize = 20, timezone = 'Asia/Shanghai' }) {
    let whereClauses = [];
    let params = [];

    let boundary = null;
    if (month) {
      boundary = getMonthUtcBoundary(month, timezone);
      whereClauses.push('t.transaction_time >= ? AND t.transaction_time <= ?');
      params.push(boundary.startIso, boundary.endIso);
    }

    if (type && ['EXPENSE', 'INCOME'].includes(type)) {
      whereClauses.push('t.type = ?');
      params.push(type);
    }

    if (categoryId) {
      whereClauses.push('t.category_id = ?');
      params.push(categoryId);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countRow = this.db.prepare(`SELECT count(*) as total FROM transactions t ${whereStr}`).get(...params);
    const total = Number(countRow.total);

    // 查询分页列表
    const limit = Math.min(Math.max(1, Number(pageSize) || 20), 100);
    const offset = (Math.max(1, Number(page) || 1) - 1) * limit;

    const itemsRows = this.db.prepare(`
      SELECT 
        t.id, t.amount_cents as amountCents, t.amount, t.type,
        t.category_id as categoryId, t.transaction_time as transactionTime,
        t.note, t.created_at as createdAt, t.updated_at as updatedAt,
        c.name as cat_name, c.icon as cat_icon, c.color as cat_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ${whereStr}
      ORDER BY t.transaction_time DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const items = itemsRows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      amountCents: Number(row.amountCents),
      categoryId: row.categoryId,
      category: {
        id: row.categoryId,
        name: row.cat_name,
        icon: row.cat_icon,
        color: row.cat_color,
      },
      transactionTime: row.transactionTime,
      note: row.note || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    // 若传入了 month，计算当月的收支总计
    let monthSummary = null;
    if (month && boundary) {
      const summaryRow = this.db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount_cents ELSE 0 END), 0) as totalExpenseCents,
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount_cents ELSE 0 END), 0) as totalIncomeCents
        FROM transactions
        WHERE transaction_time >= ? AND transaction_time <= ?
      `).get(boundary.startIso, boundary.endIso);

      const expCents = BigInt(summaryRow.totalExpenseCents);
      const incCents = BigInt(summaryRow.totalIncomeCents);
      const balCents = incCents - expCents;

      monthSummary = {
        month,
        totalExpense: centsToAmountNumber(expCents),
        totalExpenseCents: Number(expCents),
        totalIncome: centsToAmountNumber(incCents),
        totalIncomeCents: Number(incCents),
        balance: centsToAmountNumber(balCents),
        balanceCents: Number(balCents),
      };
    }

    return {
      items,
      pagination: {
        page: Number(page) || 1,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: offset + items.length < total,
      },
      monthSummary,
    };
  }

  /**
   * 统计模块 1：月度收支概览卡片数据
   */
  getMonthOverview(month, timezone = 'Asia/Shanghai') {
    const boundary = getMonthUtcBoundary(month, timezone);

    // 当月统计
    const current = this.db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount_cents ELSE 0 END), 0) as totalExpenseCents,
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount_cents ELSE 0 END), 0) as totalIncomeCents,
        COUNT(id) as count
      FROM transactions
      WHERE transaction_time >= ? AND transaction_time <= ?
    `).get(boundary.startIso, boundary.endIso);

    const expCents = BigInt(current.totalExpenseCents);
    const incCents = BigInt(current.totalIncomeCents);
    const balCents = incCents - expCents;

    // 上月月份计算
    let prevYear = boundary.year;
    let prevMonth = boundary.month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevMonthStr = `${prevYear}-${prevMonth < 10 ? '0' + prevMonth : prevMonth}`;
    const prevBoundary = getMonthUtcBoundary(prevMonthStr, timezone);

    const prev = this.db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount_cents ELSE 0 END), 0) as totalExpenseCents,
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount_cents ELSE 0 END), 0) as totalIncomeCents
      FROM transactions
      WHERE transaction_time >= ? AND transaction_time <= ?
    `).get(prevBoundary.startIso, prevBoundary.endIso);

    const prevExpCents = BigInt(prev.totalExpenseCents);
    const prevIncCents = BigInt(prev.totalIncomeCents);

    let expenseGrowthRate = null;
    if (prevExpCents > 0n) {
      expenseGrowthRate = Number(expCents - prevExpCents) / Number(prevExpCents);
      expenseGrowthRate = Math.round(expenseGrowthRate * 1000) / 1000;
    }

    let incomeGrowthRate = null;
    if (prevIncCents > 0n) {
      incomeGrowthRate = Number(incCents - prevIncCents) / Number(prevIncCents);
      incomeGrowthRate = Math.round(incomeGrowthRate * 1000) / 1000;
    }

    return {
      month,
      totalIncome: centsToAmountNumber(incCents),
      totalIncomeCents: Number(incCents),
      totalExpense: centsToAmountNumber(expCents),
      totalExpenseCents: Number(expCents),
      balance: centsToAmountNumber(balCents),
      balanceCents: Number(balCents),
      transactionCount: Number(current.count),
      comparisonLastMonth: {
        expenseGrowthRate,
        incomeGrowthRate,
      },
    };
  }

  /**
   * 统计模块 2：分类支出/收入占比结构分析
   */
  getCategoryDistribution(month, type = 'EXPENSE', timezone = 'Asia/Shanghai') {
    const boundary = getMonthUtcBoundary(month, timezone);

    const rows = this.db.prepare(`
      SELECT 
        c.id as categoryId, c.name as categoryName, c.icon, c.color,
        COALESCE(SUM(t.amount_cents), 0) as amountCents,
        COUNT(t.id) as transactionCount
      FROM categories c
      JOIN transactions t ON c.id = t.category_id
      WHERE t.type = ? AND t.transaction_time >= ? AND t.transaction_time <= ?
      GROUP BY c.id
      ORDER BY amountCents DESC
    `).all(type, boundary.startIso, boundary.endIso);

    const totalCents = rows.reduce((acc, r) => acc + BigInt(r.amountCents), 0n);

    const items = rows.map((r) => {
      const cents = BigInt(r.amountCents);
      const percentage = totalCents > 0n ? Number(cents) / Number(totalCents) : 0;
      return {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        icon: r.icon,
        color: r.color,
        amount: centsToAmountNumber(cents),
        amountCents: Number(cents),
        percentage: Math.round(percentage * 10000) / 10000,
        transactionCount: Number(r.transactionCount),
      };
    });

    return {
      month,
      type,
      totalAmount: centsToAmountNumber(totalCents),
      totalAmountCents: Number(totalCents),
      items,
    };
  }

  /**
   * 统计模块 3：月度日趋势聚合流水 (Daily Trend)
   */
  getDailyTrend(month, timezone = 'Asia/Shanghai') {
    const boundary = getMonthUtcBoundary(month, timezone);

    // 查询该月所有的流水记录
    const rows = this.db.prepare(`
      SELECT amount_cents, type, transaction_time
      FROM transactions
      WHERE transaction_time >= ? AND transaction_time <= ?
    `).all(boundary.startIso, boundary.endIso);

    // 初始化该月每一天的数据
    const daysMap = new Map();
    for (let day = 1; day <= boundary.daysInMonth; day++) {
      const dayStr = `${boundary.year}-${boundary.month < 10 ? '0' + boundary.month : boundary.month}-${day < 10 ? '0' + day : day}`;
      daysMap.set(dayStr, {
        date: dayStr,
        expenseCents: 0n,
        incomeCents: 0n,
      });
    }

    // 聚合每条记录到对应的客户端本地日期
    for (const row of rows) {
      const localDate = formatLocalDate(row.transaction_time, timezone);
      if (daysMap.has(localDate)) {
        const item = daysMap.get(localDate);
        const cents = BigInt(row.amount_cents);
        if (row.type === 'EXPENSE') {
          item.expenseCents += cents;
        } else if (row.type === 'INCOME') {
          item.incomeCents += cents;
        }
      }
    }

    const days = Array.from(daysMap.values()).map((d) => ({
      date: d.date,
      expense: centsToAmountNumber(d.expenseCents),
      expenseCents: Number(d.expenseCents),
      income: centsToAmountNumber(d.incomeCents),
      incomeCents: Number(d.incomeCents),
    }));

    return {
      month,
      days,
    };
  }
}
