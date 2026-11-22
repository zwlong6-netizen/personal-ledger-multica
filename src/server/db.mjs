/**
 * SQLite 数据存储与初始化层 (Database Access Layer)
 * 采用 Node.js 22/26 原生 node:sqlite
 * 金额整型分存储 (amount_cents INTEGER/BIGINT) 辅以小数冗余 (amount DECIMAL)
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DEFAULT_CATEGORIES = [
  // 支出类 (EXPENSE)
  { id: 'cat_exp_food', name: '餐饮美食', type: 'EXPENSE', icon: 'Utensils', color: '#EF4444', is_default: 1, sort_order: 1 },
  { id: 'cat_exp_traffic', name: '交通出行', type: 'EXPENSE', icon: 'Car', color: '#F97316', is_default: 1, sort_order: 2 },
  { id: 'cat_exp_shopping', name: '日用百货', type: 'EXPENSE', icon: 'ShoppingBag', color: '#F59E0B', is_default: 1, sort_order: 3 },
  { id: 'cat_exp_fun', name: '休闲娱乐', type: 'EXPENSE', icon: 'Gamepad2', color: '#8B5CF6', is_default: 1, sort_order: 4 },
  { id: 'cat_exp_digital', name: '数码电器', type: 'EXPENSE', icon: 'Smartphone', color: '#3B82F6', is_default: 1, sort_order: 5 },
  { id: 'cat_exp_housing', name: '住房缴费', type: 'EXPENSE', icon: 'Home', color: '#06B6D4', is_default: 1, sort_order: 6 },
  { id: 'cat_exp_medical', name: '医疗保健', type: 'EXPENSE', icon: 'HeartPulse', color: '#EC4899', is_default: 1, sort_order: 7 },
  { id: 'cat_exp_clothes', name: '服饰美容', type: 'EXPENSE', icon: 'Sparkles', color: '#10B981', is_default: 1, sort_order: 8 },
  { id: 'cat_exp_other', name: '其他支出', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748B', is_default: 1, sort_order: 9 },
  // 收入类 (INCOME)
  { id: 'cat_inc_salary', name: '工资薪酬', type: 'INCOME', icon: 'Wallet', color: '#10B981', is_default: 1, sort_order: 1 },
  { id: 'cat_inc_bonus', name: '奖金津贴', type: 'INCOME', icon: 'Award', color: '#059669', is_default: 1, sort_order: 2 },
  { id: 'cat_inc_parttime', name: '兼职外包', type: 'INCOME', icon: 'Briefcase', color: '#3B82F6', is_default: 1, sort_order: 3 },
  { id: 'cat_inc_invest', name: '理财投资', type: 'INCOME', icon: 'TrendingUp', color: '#6366F1', is_default: 1, sort_order: 4 },
  { id: 'cat_inc_gift', name: '人情红包', type: 'INCOME', icon: 'Gift', color: '#EC4899', is_default: 1, sort_order: 5 },
  { id: 'cat_inc_other', name: '其他收入', type: 'INCOME', icon: 'Coins', color: '#64748B', is_default: 1, sort_order: 6 },
];

/**
 * 创建并初始化数据库实例
 * @param {string} [dbPath] 数据库存储路径或 ':memory:'
 * @returns {DatabaseSync}
 */
export function initDatabase(dbPath = './data/ledger.db') {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // 开启外键约束支持
  db.exec('PRAGMA foreign_keys = ON;');

  // 初始化分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('EXPENSE', 'INCOME')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748B',
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_categories_type_order ON categories (type, sort_order ASC);
  `);

  // 初始化交易流水表
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      amount REAL NOT NULL CHECK (amount > 0),
      type TEXT NOT NULL CHECK(type IN ('EXPENSE', 'INCOME')),
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      transaction_time TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_time ON transactions (transaction_time DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_cat ON transactions (category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type_time ON transactions (type, transaction_time DESC);
  `);

  // 种子数据预置检查
  const countRow = db.prepare('SELECT count(*) as count FROM categories').get();
  if (countRow.count === 0) {
    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO categories (id, name, type, icon, color, is_default, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cat of DEFAULT_CATEGORIES) {
      insertStmt.run(cat.id, cat.name, cat.type, cat.icon, cat.color, cat.is_default, cat.sort_order, now, now);
    }
  }

  return db;
}
