/**
 * HTTP REST API 服务网关与路由分发器 (Node.js 原生 http)
 */

import http from 'node:http';
import { URL } from 'node:url';
import { initDatabase } from './db.mjs';
import { CategoryService } from './categoryService.mjs';
import { TransactionService } from './transactionService.mjs';
import { HTML_CLIENT } from '../client/index.mjs';

/**
 * 封装 JSON 格式化响应
 */
function sendJson(res, statusCode, data) {
  const payload = JSON.stringify({
    success: statusCode >= 200 && statusCode < 300,
    ...data,
    timestamp: new Date().toISOString(),
  });
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Timezone, Authorization',
  });
  res.end(payload);
}

/**
 * 封装错误响应
 */
function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  const payload = {
    error: {
      code: error.code || (statusCode === 400 ? 'BAD_REQUEST' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
      message: error.message || 'Server error',
      details: error.details,
    },
  };
  sendJson(res, statusCode, payload);
}

/**
 * 读取 HTTP 请求体 JSON
 */
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        const error = new Error('Invalid JSON format');
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

/**
 * 创建应用 HTTP 实例
 * @param {string} [dbPath]
 */
export function createApp(dbPath = './data/ledger.db') {
  const db = initDatabase(dbPath);
  const categoryService = new CategoryService(db);
  const transactionService = new TransactionService(db, categoryService);

  const server = http.createServer(async (req, res) => {
    // CORS 预检
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Timezone, Authorization',
      });
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    const timezone = req.headers['x-timezone'] || parsedUrl.searchParams.get('timezone') || 'Asia/Shanghai';

    try {
      // 1. 静态主页 SPA
      if (method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(HTML_CLIENT);
        return;
      }

      // 2. 健康探针 Health Check
      if (method === 'GET' && pathname === '/health') {
        const dbCheck = db.prepare('SELECT 1 as alive').get();
        sendJson(res, 200, { data: { status: 'ok', database: dbCheck.alive === 1 ? 'connected' : 'error' } });
        return;
      }

      // 3. API - 分类管理 (Categories)
      // GET /api/v1/categories
      if (method === 'GET' && pathname === '/api/v1/categories') {
        const type = parsedUrl.searchParams.get('type');
        const list = categoryService.list(type);
        sendJson(res, 200, { data: list });
        return;
      }

      // POST /api/v1/categories
      if (method === 'POST' && pathname === '/api/v1/categories') {
        const body = await parseJsonBody(req);
        const created = categoryService.create(body);
        sendJson(res, 201, { data: created });
        return;
      }

      // PUT /api/v1/categories/:id
      const catPutMatch = /^\/api\/v1\/categories\/([^\/]+)$/.exec(pathname);
      if (method === 'PUT' && catPutMatch) {
        const id = catPutMatch[1];
        const body = await parseJsonBody(req);
        const updated = categoryService.update(id, body);
        sendJson(res, 200, { data: updated });
        return;
      }

      // DELETE /api/v1/categories/:id
      const catDelMatch = /^\/api\/v1\/categories\/([^\/]+)$/.exec(pathname);
      if (method === 'DELETE' && catDelMatch) {
        const id = catDelMatch[1];
        const result = categoryService.delete(id);
        sendJson(res, 200, { data: result });
        return;
      }

      // 4. API - 账单流水 (Transactions)
      // POST /api/v1/transactions
      if (method === 'POST' && pathname === '/api/v1/transactions') {
        const body = await parseJsonBody(req);
        const created = transactionService.create(body);
        sendJson(res, 201, { data: created });
        return;
      }

      // GET /api/v1/transactions
      if (method === 'GET' && pathname === '/api/v1/transactions') {
        const month = parsedUrl.searchParams.get('month');
        const type = parsedUrl.searchParams.get('type');
        const categoryId = parsedUrl.searchParams.get('categoryId');
        const page = parsedUrl.searchParams.get('page') || 1;
        const pageSize = parsedUrl.searchParams.get('pageSize') || 20;

        const result = transactionService.list({ month, type, categoryId, page, pageSize, timezone });
        sendJson(res, 200, { data: result });
        return;
      }

      // GET /api/v1/transactions/:id
      const txGetMatch = /^\/api\/v1\/transactions\/([^\/]+)$/.exec(pathname);
      if (method === 'GET' && txGetMatch) {
        const id = txGetMatch[1];
        const tx = transactionService.getById(id);
        if (!tx) {
          const err = new Error('Transaction not found');
          err.statusCode = 404;
          throw err;
        }
        sendJson(res, 200, { data: tx });
        return;
      }

      // PUT /api/v1/transactions/:id
      const txPutMatch = /^\/api\/v1\/transactions\/([^\/]+)$/.exec(pathname);
      if (method === 'PUT' && txPutMatch) {
        const id = txPutMatch[1];
        const body = await parseJsonBody(req);
        const updated = transactionService.update(id, body);
        sendJson(res, 200, { data: updated });
        return;
      }

      // DELETE /api/v1/transactions/:id
      const txDelMatch = /^\/api\/v1\/transactions\/([^\/]+)$/.exec(pathname);
      if (method === 'DELETE' && txDelMatch) {
        const id = txDelMatch[1];
        const result = transactionService.delete(id);
        sendJson(res, 200, { data: result });
        return;
      }

      // 5. API - 统计看板模块 (Stats)
      // GET /api/v1/stats/overview
      if (method === 'GET' && pathname === '/api/v1/stats/overview') {
        const month = parsedUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7);
        const overview = transactionService.getMonthOverview(month, timezone);
        sendJson(res, 200, { data: overview });
        return;
      }

      // GET /api/v1/stats/category-distribution
      if (method === 'GET' && pathname === '/api/v1/stats/category-distribution') {
        const month = parsedUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7);
        const type = parsedUrl.searchParams.get('type') || 'EXPENSE';
        const dist = transactionService.getCategoryDistribution(month, type, timezone);
        sendJson(res, 200, { data: dist });
        return;
      }

      // GET /api/v1/stats/daily-trend
      if (method === 'GET' && pathname === '/api/v1/stats/daily-trend') {
        const month = parsedUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7);
        const trend = transactionService.getDailyTrend(month, timezone);
        sendJson(res, 200, { data: trend });
        return;
      }

      // 404 兜底
      const notFoundErr = new Error(`Cannot ${method} ${pathname}`);
      notFoundErr.statusCode = 404;
      throw notFoundErr;

    } catch (err) {
      sendError(res, err);
    }
  });

  return { server, db, categoryService, transactionService };
}

// 独立启动入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3000;
  const { server } = createApp('./data/ledger.db');
  server.listen(PORT, () => {
    console.log(`[Ledger App] Server running at http://localhost:${PORT}`);
    console.log(`[Ledger App] Healthcheck: http://localhost:${PORT}/health`);
    console.log(`[Ledger App] UI Prototype: http://localhost:${PORT}`);
  });
}
