/**
 * 分类管理业务逻辑服务 (Category Service)
 */

import { randomUUID } from 'node:crypto';

export class CategoryService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * 获取所有分类，并附带该分类下的关联账单数量
   * @param {'EXPENSE'|'INCOME'|null} [type]
   */
  list(type = null) {
    let sql = `
      SELECT 
        c.id, c.name, c.type, c.icon, c.color, 
        c.is_default as isDefault, c.sort_order as sortOrder,
        c.created_at as createdAt, c.updated_at as updatedAt,
        COUNT(t.id) as transactionCount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
    `;
    const params = [];
    if (type) {
      sql += ' WHERE c.type = ?';
      params.push(type);
    }
    sql += ' GROUP BY c.id ORDER BY c.sort_order ASC, c.created_at ASC';

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((r) => ({
      ...r,
      isDefault: Boolean(r.isDefault),
      transactionCount: Number(r.transactionCount),
    }));
  }

  /**
   * 获取单个分类详情
   * @param {string} id
   */
  getById(id) {
    const row = this.db.prepare(`
      SELECT 
        c.id, c.name, c.type, c.icon, c.color, 
        c.is_default as isDefault, c.sort_order as sortOrder,
        c.created_at as createdAt, c.updated_at as updatedAt,
        COUNT(t.id) as transactionCount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id);

    if (!row) return null;
    return {
      ...row,
      isDefault: Boolean(row.isDefault),
      transactionCount: Number(row.transactionCount),
    };
  }

  /**
   * 创建自定义分类
   * @param {{ name: string, type: 'EXPENSE'|'INCOME', icon: string, color: string, sortOrder?: number }} param0
   */
  create({ name, type, icon, color, sortOrder = 10 }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 32) {
      const err = new Error('Category name is required (1-32 chars)');
      err.statusCode = 400;
      throw err;
    }
    if (!['EXPENSE', 'INCOME'].includes(type)) {
      const err = new Error("Category type must be 'EXPENSE' or 'INCOME'");
      err.statusCode = 400;
      throw err;
    }
    if (!icon || typeof icon !== 'string') {
      const err = new Error('Category icon is required');
      err.statusCode = 400;
      throw err;
    }
    if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      const err = new Error('Category color must be a valid hex color (e.g. #EF4444)');
      err.statusCode = 400;
      throw err;
    }

    // 检查同类型下是否重名
    const existing = this.db.prepare('SELECT id FROM categories WHERE type = ? AND name = ?').get(type, name.trim());
    if (existing) {
      const err = new Error(`Category name "${name}" already exists for type "${type}"`);
      err.statusCode = 400;
      throw err;
    }

    const id = `cat_custom_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO categories (id, name, type, icon, color, is_default, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(id, name.trim(), type, icon.trim(), color.trim(), sortOrder, now, now);

    return this.getById(id);
  }

  /**
   * 更新分类信息
   * @param {string} id
   * @param {{ name?: string, icon?: string, color?: string, sortOrder?: number }} param1
   */
  update(id, { name, icon, color, sortOrder }) {
    const cat = this.getById(id);
    if (!cat) {
      const err = new Error(`Category with id ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const newName = name !== undefined ? name.trim() : cat.name;
    const newIcon = icon !== undefined ? icon.trim() : cat.icon;
    const newColor = color !== undefined ? color.trim() : cat.color;
    const newSortOrder = sortOrder !== undefined ? Number(sortOrder) : cat.sortOrder;

    if (newName.length === 0 || newName.length > 32) {
      const err = new Error('Category name must be between 1 and 32 characters');
      err.statusCode = 400;
      throw err;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      const err = new Error('Category color must be a valid hex color');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE categories
      SET name = ?, icon = ?, color = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(newName, newIcon, newColor, newSortOrder, now, id);

    return this.getById(id);
  }

  /**
   * 删除分类（具备严格的预置保护与关联账单拦截检查）
   * @param {string} id
   */
  delete(id) {
    const cat = this.getById(id);
    if (!cat) {
      const err = new Error(`Category with id ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    // 1. 系统预置分类保护
    if (cat.isDefault) {
      const err = new Error('系统预设分类不可物理删除');
      err.statusCode = 403;
      err.code = 'CANNOT_DELETE_DEFAULT_CATEGORY';
      throw err;
    }

    // 2. 存在关联账单拦截保护
    if (cat.transactionCount > 0) {
      const err = new Error(`该分类下存在 ${cat.transactionCount} 笔账单，不可直接删除。请先迁移账单或修改账单分类。`);
      err.statusCode = 409;
      err.code = 'CATEGORY_IN_USE';
      err.details = {
        categoryId: id,
        transactionCount: cat.transactionCount,
      };
      throw err;
    }

    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    return {
      id,
      deleted: true,
    };
  }
}
