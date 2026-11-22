# 个人记账本 MVP 原型工程运行与操作指南

本项目根据 **TASK-1 PRD**、**TASK-2 UI/UX 规范**、**TASK-3 技术架构** 及 **TASK-4 测试规范** 完整实现，提供轻量独立运行、零外部依赖的全栈 Web 原型系统。

---

## 1. 核心架构与功能特性

1. **金融级金额计算与防浮点误差**：
   - 底层存储采用整型分 (`amount_cents BIGINT/INTEGER`)，输入输出辅以两位小数 (`amount REAL/DECIMAL`)。
   - 彻底抹平 IEEE 754 浮点累加偏差（如 `0.1 + 0.2 = 0.3`），保障资金平衡。
2. **时区与跨月自然月对齐**：
   - 统一 UTC 时间戳存储，支持 `Asia/Shanghai` 等 IANA 时区月度毫秒级边界切分与跨月归属。
3. **数据一致性与外键完整性保障**：
   - 内置预置分类（9大支出、6大收入）受只读保护，禁止物理删除；
   - 自定义分类删除带有已关联账单强拦截保护（返回 `409 Conflict` 与账单笔数），杜绝孤儿脏数据。
4. **全功能现代响应式 SPA 原型**：
   - 月度收支看板（总支出、总收入、净结余、分类占比进度条）；
   - 快速记账模态交互（支出/收入一键切换、分类图标直选、金额格式校验、日期时间选择、备注录入）；
   - 账单流水列表（按月筛选、类型过滤、分类过滤、单项删除）；
   - 自定义分类管理（支持新增分类、色值、图标、防删保护）。

---

## 2. 快速启动与本地运行

工程基于 Node.js 原生模块（`node:http` + `node:sqlite`），无需任何外部网络包安装即可零依赖启动。

### 启动服务
```bash
# 启动本地服务 (默认端口 3000)
node src/server/index.mjs

# 或通过 npm script 启动
npm start
```

### 访问地址
- 前端 Web 原型界面：[http://localhost:3000](http://localhost:3000)
- 服务健康探针：[http://localhost:3000/health](http://localhost:3000/health)
- RESTful API 根路径：[http://localhost:3000/api/v1](http://localhost:3000/api/v1)

---

## 3. 自动化测试套件执行

测试套件覆盖金额防浮点误差、时区边界、分类完整性、报表聚合对齐及端到端冒烟全链路共 28 项断言。

```bash
# 一键运行全部自动化测试
node --test tests/unit/*.test.mjs

# 或通过 npm script
npm test
```

### 测试矩阵概览
- `tests/unit/currency.test.mjs`: 金额精度、范围限制、10,000次0.01微小累加及负结余；
- `tests/unit/timezone.test.mjs`: 月末/月初临界毫秒切分、跨时区独立性、闰年29天；
- `tests/unit/category.test.mjs`: 预置分类删除拦截（403）、关联账单拦截（409）、安全迁移与删除；
- `tests/unit/aggregation.test.mjs`: 月度概览、分类占比、日趋势与明细列表三方严格一致性比对；
- `tests/unit/smoke.test.mjs`: 端到端完整生命周期与健康探针冒烟测试。

---

## 4. 目录结构说明

```
.
├── package.json                   # 工程配置文件与运行脚本
├── README.md                      # 运行与操作指南
├── src
│   ├── client
│   │   └── index.mjs              # 现代响应式前端 SPA (Tailwind + Lucide + API联调)
│   └── server
│       ├── currency.mjs           # 金额整型分换算与防浮点计算工具
│       ├── timezone.mjs           # 自然月与时区边界计算工具
│       ├── db.mjs                 # node:sqlite 数据库初始化与预置种子
│       ├── categoryService.mjs    # 分类服务与防删保护拦截
│       ├── transactionService.mjs # 流水记账与月度报表聚合服务
│       └── index.mjs              # HTTP RESTful API 服务入口与路由
├── tests
│   └── unit
│       ├── currency.test.mjs      # 金额精度单元测试
│       ├── timezone.test.mjs      # 时区边界单元测试
│       ├── category.test.mjs      # 分类与防删拦截测试
│       ├── aggregation.test.mjs   # 报表一致性校验测试
│       └── smoke.test.mjs         # 端到端冒烟测试
└── docs/                          # 上游 PRD、技术架构与测试规范文档
```
