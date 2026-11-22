/**
 * 极简现代响应式前端单页应用 (Single File SPA)
 * 集成 Tailwind CSS + Lucide Icons + 首页看板 + 快速记账 + 账单明细 + 分类管理
 * 支持【极客暗黑 (Cyber Dark)】与【清爽浅色 (Classic Light)】模式一键切换与持久化
 * 深度移动端与全平台响应式适配：FAB 悬浮记账、大键位触控数字键盘、Bottom Sheet 抽屉、触控安全区
 */

export const HTML_CLIENT = `<!DOCTYPE html>
<html lang="zh-CN" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>个人记账本 - Cyber Geek Mobile Pro</title>
  <!-- Tailwind CSS CDN (启用 class-based dark mode) -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            cyber: {
              bg: '#0B0F17',
              card: '#111827',
              border: 'rgba(5, 217, 232, 0.18)',
              pink: '#FF2A6D',
              cyan: '#05D9E8',
              yellow: '#FEE715',
              purple: '#9D4EDD',
              neonGreen: '#10B981',
            }
          },
          fontFamily: {
            mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'monospace']
          }
        }
      }
    };
  </script>
  <!-- Google Fonts: JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      --bg-color: #F8FAFC;
    }
    html.dark {
      --bg-color: #0B0F17;
    }
    body {
      font-feature-settings: "tnum";
      -webkit-font-smoothing: antialiased;
      background-color: var(--bg-color);
      transition: background-color 0.3s ease, color 0.3s ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* 赛博网格背景纹理 */
    html.dark body {
      background-image: 
        linear-gradient(rgba(5, 217, 232, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(5, 217, 232, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      background-position: -1px -1px;
    }

    /* 极客荧光辉光效果 (Glow & Pulse) */
    .glow-cyan {
      box-shadow: 0 0 15px rgba(5, 217, 232, 0.35), inset 0 0 10px rgba(5, 217, 232, 0.1);
    }
    .glow-pink {
      box-shadow: 0 0 15px rgba(255, 42, 109, 0.35), inset 0 0 10px rgba(255, 42, 109, 0.1);
    }
    .glow-purple {
      box-shadow: 0 0 18px rgba(157, 78, 221, 0.4);
    }

    /* 记账按钮悬停/常驻脉冲辉光 */
    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 15px rgba(5, 217, 232, 0.5), 0 0 30px rgba(5, 217, 232, 0.2);
      }
      50% {
        box-shadow: 0 0 25px rgba(5, 217, 232, 0.8), 0 0 45px rgba(5, 217, 232, 0.4);
      }
    }
    .btn-cyber-pulse:hover, .btn-cyber-pulse-active {
      animation: pulse-glow 1.8s infinite ease-in-out;
    }

    /* 底部悬浮 FAB 呼吸特效 */
    .fab-glow {
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
    }
    html.dark .fab-glow {
      box-shadow: 0 0 20px rgba(5, 217, 232, 0.6), 0 0 40px rgba(157, 78, 221, 0.3);
    }

    /* 拟态微磨砂边框 */
    .cyber-glass {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    /* 等宽字体类 */
    .font-num {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    /* 数字滚动跳动感过渡 */
    .num-bounce {
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .num-bounce.bump {
      transform: scale(1.06);
    }

    /* 触控数字键盘按键样式 */
    .keypad-btn {
      min-height: 52px;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }
    .keypad-btn:active {
      transform: scale(0.96);
    }
  </style>
</head>
<body class="text-slate-800 dark:text-slate-200 antialiased flex flex-col min-h-screen pb-24 md:pb-6">

  <!-- 顶部导航栏 (移动端紧凑化，热区 ≥ 44x44px) -->
  <header class="bg-white/90 dark:bg-[#0D1117]/90 border-b border-slate-200 dark:border-cyan-500/20 sticky top-0 z-30 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] cyber-glass transition-colors">
    <div class="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
      <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        <div class="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-blue-600 dark:bg-gradient-to-tr dark:from-[#05D9E8] dark:to-[#9D4EDD] flex items-center justify-center text-white shadow-md shadow-blue-500/20 dark:shadow-[0_0_15px_rgba(5,217,232,0.5)] transition-all">
          <i data-lucide="terminal" class="w-4 h-4 sm:w-5 sm:h-5 hidden dark:block"></i>
          <i data-lucide="wallet" class="w-4 h-4 sm:w-5 sm:h-5 block dark:hidden"></i>
        </div>
        <div class="min-w-0">
          <div class="flex items-center space-x-1.5 sm:space-x-2">
            <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">个人记账本</h1>
            <span class="hidden sm:inline-block text-[10px] font-num px-1.5 py-0.5 rounded border border-cyan-400/40 text-cyan-400 bg-cyan-950/40 uppercase tracking-widest font-semibold shrink-0">CYBER_PRO</span>
          </div>
          <p class="text-[11px] sm:text-xs text-slate-500 dark:text-cyan-400/60 font-medium font-num truncate">分单位无损记账</p>
        </div>
      </div>

      <div class="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        <!-- 主题切换 Switch Button (优化移动端触摸热区 ≥ 44x44px) -->
        <button id="themeToggleBtn" onclick="toggleTheme()" class="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:border dark:border-cyan-500/30 text-slate-700 dark:text-cyan-400 transition-all cursor-pointer flex items-center justify-center space-x-1" title="切换极客暗黑/清爽浅色模式" aria-label="切换模式">
          <i id="themeIconSun" data-lucide="sun" class="w-4 h-4 text-amber-500 hidden dark:block"></i>
          <i id="themeIconMoon" data-lucide="moon" class="w-4 h-4 text-indigo-600 block dark:hidden"></i>
          <span id="themeText" class="text-xs font-semibold hidden sm:inline-block font-num">极客暗黑</span>
        </button>

        <!-- 月份切换 (移动端紧凑输入体验) -->
        <input type="month" id="monthPicker" class="text-xs sm:text-sm font-semibold font-num text-slate-700 dark:text-cyan-300 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 dark:border dark:border-cyan-500/30 rounded-xl px-2 sm:px-3 py-2 sm:py-1.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 transition-all cursor-pointer h-[44px] sm:h-auto">
        
        <!-- 桌面端记账快捷按钮 (移动端隐藏，使用大号 FAB 悬浮按键) -->
        <button onclick="openTransactionModal()" class="hidden md:flex btn-cyber-pulse items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#05D9E8] dark:to-[#00B4D8] active:scale-95 text-white dark:text-[#0B0F17] text-sm font-bold px-3.5 py-1.5 rounded-xl shadow-sm shadow-blue-600/30 dark:shadow-[0_0_15px_rgba(5,217,232,0.4)] transition-all">
          <i data-lucide="plus" class="w-4 h-4 stroke-[3]"></i>
          <span>记一笔</span>
        </button>
      </div>
    </div>
  </header>

  <!-- 主体内容容器 -->
  <main class="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full flex-1 space-y-4 sm:space-y-6">

    <!-- 1. 核心看板概览卡片 (移动端支持自适应网格与横向防溢出平滑触控) -->
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      <!-- 当月净结余卡片 (移动端全宽突出展现) -->
      <div class="sm:col-span-2 md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-[#111827] dark:to-[#1a103c] rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-blue-600/15 dark:shadow-[0_0_20px_rgba(157,78,221,0.25)] border border-transparent dark:border-purple-500/30 relative overflow-hidden transition-all">
        <div class="absolute -right-4 -bottom-4 opacity-15 dark:opacity-20 text-cyan-400 pointer-events-none">
          <i data-lucide="cpu" class="w-24 sm:w-28 h-24 sm:h-28 hidden dark:block"></i>
          <i data-lucide="scale" class="w-24 sm:w-28 h-24 sm:h-28 block dark:hidden"></i>
        </div>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-blue-100 dark:text-purple-300 uppercase tracking-wider font-num">当月净结余 [NET_BALANCE]</p>
          <span class="hidden dark:inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        </div>
        <div id="statBalance" class="num-bounce font-num text-2xl sm:text-3xl font-extrabold mt-1 sm:mt-2 tracking-tight text-white dark:text-cyan-300 dark:drop-shadow-[0_0_10px_rgba(5,217,232,0.5)] truncate">¥0.00</div>
        <div class="mt-2 sm:mt-3 flex items-center text-xs text-blue-100 dark:text-purple-200/80 font-num">
          <span id="statTxCount">共 0 笔明细</span>
        </div>
      </div>

      <!-- 月度总支出卡片 -->
      <div class="bg-white dark:bg-[#111827]/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-rose-500/25 shadow-xs dark:shadow-[0_0_15px_rgba(255,42,109,0.12)] relative overflow-hidden transition-all cyber-glass">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 dark:text-rose-400/80 uppercase tracking-wider font-num">本月总支出 [OUTFLOW]</span>
          <span class="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-[#FF2A6D] flex items-center justify-center dark:border dark:border-rose-500/30">
            <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
          </span>
        </div>
        <div id="statExpense" class="num-bounce font-num text-xl sm:text-2xl font-bold text-rose-600 dark:text-[#FF2A6D] mt-1 sm:mt-2 dark:drop-shadow-[0_0_8px_rgba(255,42,109,0.5)] truncate">¥0.00</div>
        <p class="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1.5 sm:mt-2 font-num">严格整型分 (Integer Cents)</p>
      </div>

      <!-- 月度总收入卡片 -->
      <div class="bg-white dark:bg-[#111827]/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-cyan-500/25 shadow-xs dark:shadow-[0_0_15px_rgba(5,217,232,0.12)] relative overflow-hidden transition-all cyber-glass">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 dark:text-emerald-400/80 uppercase tracking-wider font-num">本月总收入 [INFLOW]</span>
          <span class="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#05D9E8] flex items-center justify-center dark:border dark:border-cyan-500/30">
            <i data-lucide="arrow-down-left" class="w-4 h-4"></i>
          </span>
        </div>
        <div id="statIncome" class="num-bounce font-num text-xl sm:text-2xl font-bold text-emerald-600 dark:text-[#05D9E8] mt-1 sm:mt-2 dark:drop-shadow-[0_0_8px_rgba(5,217,232,0.5)] truncate">¥0.00</div>
        <p class="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1.5 sm:mt-2 font-num">资金状态 (STATUS: OK)</p>
      </div>
    </section>

    <!-- 2. 分类支出占比与统计进度 (自适应移动端与全宽进度条) -->
    <section class="bg-white dark:bg-[#111827]/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-cyan-500/20 shadow-xs dark:shadow-[0_0_15px_rgba(0,0,0,0.4)] transition-all cyber-glass">
      <div class="flex items-center justify-between mb-3 sm:mb-4">
        <div class="flex items-center space-x-2">
          <i data-lucide="pie-chart" class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-cyan-400"></i>
          <h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">支出分类分布</h2>
        </div>
        <button onclick="openCategoryManageModal()" class="text-xs font-medium text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 flex items-center space-x-1 px-2.5 py-1.5 rounded-lg dark:bg-slate-800/80 dark:border dark:border-cyan-500/30 transition-all min-h-[36px]">
          <i data-lucide="settings" class="w-3.5 h-3.5"></i>
          <span>分类管理</span>
        </button>
      </div>
      <div id="categoryDistributionContainer" class="space-y-3">
        <!-- 动态渲染分类条 -->
        <p class="text-sm text-slate-400 dark:text-slate-500 py-3 text-center">暂无支出数据</p>
      </div>
    </section>

    <!-- 3. 账单流水列表明细 (移动端卡片式自适应，布局清晰紧凑) -->
    <section class="bg-white dark:bg-[#111827]/90 rounded-2xl border border-slate-200/80 dark:border-cyan-500/20 shadow-xs dark:shadow-[0_0_15px_rgba(0,0,0,0.4)] overflow-hidden transition-all cyber-glass">
      <div class="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex items-center space-x-2">
          <i data-lucide="receipt-text" class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-cyan-400"></i>
          <h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">账单明细流水</h2>
        </div>
        <!-- 筛选过滤器 (移动端优化自适应全宽或紧凑排布) -->
        <div class="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto">
          <select id="filterType" onchange="loadTransactions()" class="flex-1 sm:flex-initial text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 border-0 dark:border dark:border-cyan-500/30 rounded-lg px-2 sm:px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 font-num min-h-[36px]">
            <option value="ALL">全部收支 (ALL)</option>
            <option value="EXPENSE">仅支出 (EXP)</option>
            <option value="INCOME">仅收入 (INC)</option>
          </select>
          <select id="filterCategory" onchange="loadTransactions()" class="flex-1 sm:flex-initial text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 border-0 dark:border dark:border-cyan-500/30 rounded-lg px-2 sm:px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 font-num min-h-[36px]">
            <option value="">全部分类</option>
          </select>
        </div>
      </div>

      <!-- 明细列表流 -->
      <div id="transactionList" class="divide-y divide-slate-100 dark:divide-slate-800/80">
        <div class="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">加载中...</div>
      </div>
    </section>

  </main>

  <!-- 底部常驻悬浮记账按钮 (FAB - Floating Action Button 专为移动端单手大拇指优化) -->
  <div class="fixed md:hidden bottom-6 right-6 z-40" style="bottom: max(1.5rem, env(safe-area-inset-bottom, 1.5rem));">
    <button onclick="openTransactionModal()" class="fab-glow w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-tr dark:from-[#05D9E8] dark:to-[#9D4EDD] text-white dark:text-[#0B0F17] flex items-center justify-center active:scale-95 transition-transform duration-150 cursor-pointer shadow-lg" aria-label="快捷记账">
      <i data-lucide="plus" class="w-7 h-7 stroke-[3]"></i>
    </button>
  </div>

  <!-- 记账弹窗表单 Modal (在移动端自适应为 Bottom Sheet 底部弹出抽屉，带大尺寸触控数字键盘) -->
  <div id="txModal" class="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 hidden transition-opacity duration-200">
    <div class="bg-white dark:bg-[#111827] border-t sm:border border-slate-200 dark:border-cyan-500/40 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl dark:shadow-[0_0_35px_rgba(5,217,232,0.3)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-200">
      
      <!-- 移动端抽屉下拉指示手柄 (Drag Handle) -->
      <div class="sm:hidden w-full pt-3 pb-1 flex justify-center">
        <div class="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      </div>

      <!-- 弹窗标题 -->
      <div class="px-5 py-3 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2">
          <i data-lucide="edit-3" class="w-4 h-4 text-blue-600 dark:text-cyan-400"></i>
          <h3 id="txModalTitle" class="text-base font-bold text-slate-900 dark:text-white">记一笔账</h3>
        </div>
        <button onclick="closeTransactionModal()" class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-2 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="关闭">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="txForm" onsubmit="submitTransaction(event)" class="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
        <input type="hidden" id="txId">

        <!-- 收支类型切换 Switch -->
        <div class="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-center font-semibold text-sm">
          <button type="button" id="tabExpense" onclick="switchTxType('EXPENSE')" class="py-2.5 sm:py-2 rounded-lg bg-rose-500 text-white shadow-xs dark:bg-[#FF2A6D] dark:shadow-[0_0_12px_rgba(255,42,109,0.5)] transition-all font-num">
            支出 (EXPENSE)
          </button>
          <button type="button" id="tabIncome" onclick="switchTxType('INCOME')" class="py-2.5 sm:py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all font-num">
            收入 (INCOME)
          </button>
        </div>

        <!-- 金额输入与显示区 -->
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 font-num">金额 (CNY / 元)</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 dark:text-cyan-400/70 font-num">¥</span>
            <input type="number" step="0.01" min="0.01" max="999999999.99" required id="txAmount" placeholder="0.00" class="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-500/30 rounded-xl text-2xl font-bold font-num text-slate-900 dark:text-cyan-300 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 transition-all">
          </div>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-num">底层整型分无损计算 (Integer Cents)</p>
        </div>

        <!-- 移动端大尺寸触控数字键盘 (防误触触控体验) -->
        <div class="sm:hidden bg-slate-100 dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200 dark:border-cyan-500/20">
          <div class="grid grid-cols-4 gap-1.5 text-base font-bold font-num">
            <button type="button" onclick="pressKeypad('1')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">1</button>
            <button type="button" onclick="pressKeypad('2')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">2</button>
            <button type="button" onclick="pressKeypad('3')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">3</button>
            <button type="button" onclick="pressKeypad('BACKSPACE')" class="keypad-btn bg-slate-200 dark:bg-slate-700/80 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center" aria-label="退格">
              <i data-lucide="delete" class="w-5 h-5"></i>
            </button>

            <button type="button" onclick="pressKeypad('4')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">4</button>
            <button type="button" onclick="pressKeypad('5')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">5</button>
            <button type="button" onclick="pressKeypad('6')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">6</button>
            <button type="button" onclick="pressKeypad('CLEAR')" class="keypad-btn bg-slate-200 dark:bg-slate-700/80 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-center justify-center font-semibold">清空</button>

            <button type="button" onclick="pressKeypad('7')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">7</button>
            <button type="button" onclick="pressKeypad('8')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">8</button>
            <button type="button" onclick="pressKeypad('9')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">9</button>
            <button type="button" onclick="pressKeypad('+10')" class="keypad-btn bg-slate-200 dark:bg-slate-700/80 text-blue-600 dark:text-cyan-400 text-xs rounded-xl flex items-center justify-center font-semibold">+10</button>

            <button type="button" onclick="pressKeypad('.')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">.</button>
            <button type="button" onclick="pressKeypad('0')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center">0</button>
            <button type="button" onclick="pressKeypad('00')" class="keypad-btn bg-white dark:bg-slate-800 text-slate-800 dark:text-cyan-300 rounded-xl shadow-xs flex items-center justify-center text-sm">00</button>
            <button type="button" onclick="pressKeypad('+100')" class="keypad-btn bg-slate-200 dark:bg-slate-700/80 text-blue-600 dark:text-cyan-400 text-xs rounded-xl flex items-center justify-center font-semibold">+100</button>
          </div>
        </div>

        <!-- 分类选择网格 (大触摸热区) -->
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 font-num">选择分类 (CATEGORY)</label>
          <div id="txCategoryGrid" class="grid grid-cols-4 gap-2 max-h-36 sm:max-h-40 overflow-y-auto p-1 scrollbar-none">
            <!-- 动态分类按钮 -->
          </div>
        </div>

        <!-- 记账时间与备注 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 font-num">交易时间</label>
            <input type="datetime-local" id="txTime" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-500/30 rounded-xl text-xs font-medium font-num text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 min-h-[42px]">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 font-num">备注说明 (选填)</label>
            <input type="text" id="txNote" maxlength="100" placeholder="如午餐聚会/奖金" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-500/30 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 min-h-[42px]">
          </div>
        </div>

        <!-- 底部提交操作栏 (触控热区充裕) -->
        <div class="pt-2 flex items-center space-x-3 pb-2 sm:pb-0">
          <button type="button" onclick="closeTransactionModal()" class="w-1/3 py-3 sm:py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm rounded-xl transition-all">取消</button>
          <button type="submit" class="w-2/3 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#05D9E8] dark:to-[#00B4D8] active:scale-98 text-white dark:text-[#0B0F17] font-bold text-sm rounded-xl shadow-md shadow-blue-600/30 dark:shadow-[0_0_15px_rgba(5,217,232,0.4)] transition-all">保存账单</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 分类管理弹窗 Modal -->
  <div id="catModal" class="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 hidden transition-opacity duration-200">
    <div class="bg-white dark:bg-[#111827] border-t sm:border border-slate-200 dark:border-cyan-500/40 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl dark:shadow-[0_0_30px_rgba(5,217,232,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
      <!-- 移动端抽屉下拉指示手柄 -->
      <div class="sm:hidden w-full pt-3 pb-1 flex justify-center">
        <div class="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      </div>

      <div class="px-5 py-3 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">分类管理</h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-num">支持自定义分类与防删保护拦截</p>
        </div>
        <button onclick="closeCategoryManageModal()" class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-2 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="关闭">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- 分类创建表单 -->
      <div class="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <form onsubmit="submitNewCategory(event)" class="space-y-2.5 sm:space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <select id="newCatType" class="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-cyan-500/30 text-slate-800 dark:text-slate-200 rounded-lg px-2 sm:px-2.5 py-2 font-num min-h-[40px]">
              <option value="EXPENSE">支出分类</option>
              <option value="INCOME">收入分类</option>
            </select>
            <input type="text" id="newCatName" placeholder="分类名称(如猫粮)" required maxlength="20" class="col-span-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-cyan-500/30 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 min-h-[40px]">
          </div>
          <div class="flex items-center space-x-2">
            <input type="text" id="newCatIcon" placeholder="Lucide图标名(如Cat/Coffee)" value="Tag" required class="flex-1 text-xs font-medium font-num bg-white dark:bg-slate-800 border border-slate-200 dark:border-cyan-500/30 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 min-h-[40px]">
            <input type="color" id="newCatColor" value="#05D9E8" class="w-10 h-10 p-0.5 border border-slate-200 dark:border-cyan-500/30 rounded-lg cursor-pointer bg-white dark:bg-slate-800 shrink-0">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#05D9E8] dark:to-[#00B4D8] text-white dark:text-[#0B0F17] text-xs font-bold px-3 sm:px-4 py-2 rounded-lg transition-all min-h-[40px] shrink-0">
              + 添加
            </button>
          </div>
        </form>
      </div>

      <!-- 分类列表 -->
      <div id="catModalList" class="p-3 sm:p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 flex-1 space-y-2">
        <!-- 动态生成 -->
      </div>
    </div>
  </div>

  <!-- 极客终端风格 Toast 轻提示 -->
  <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 bg-slate-900/95 dark:bg-[#0D1117]/95 border border-slate-800 dark:border-cyan-500/40 text-white px-4 py-3 rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(5,217,232,0.3)] text-sm flex items-center space-x-2.5 transition-all duration-300 transform translate-y-24 opacity-0 pointer-events-none cyber-glass font-num max-w-[90vw]">
    <span id="toastTag" class="text-[10px] px-1 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-bold uppercase">SYS</span>
    <i id="toastIcon" data-lucide="check-circle" class="w-4 h-4 text-emerald-400 dark:text-cyan-400 shrink-0"></i>
    <span id="toastMsg" class="font-medium text-xs sm:text-sm truncate">操作成功</span>
  </div>

  <script>
    // 状态管理
    let currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    let allCategories = [];
    let selectedTxType = 'EXPENSE';
    let selectedCatId = null;

    // 主题管理与 localStorage 持久化
    const THEME_STORAGE_KEY = 'personal_ledger_theme';

    function initTheme() {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      // 默认提供炫酷极客风 (Cyber Dark)
      const isDark = savedTheme ? savedTheme === 'dark' : true;
      applyTheme(isDark);
    }

    function applyTheme(isDark) {
      const htmlEl = document.documentElement;
      const themeText = document.getElementById('themeText');
      if (isDark) {
        htmlEl.classList.add('dark');
        if (themeText) themeText.innerText = '极客暗黑';
      } else {
        htmlEl.classList.remove('dark');
        if (themeText) themeText.innerText = '清爽浅色';
      }
      lucide.createIcons();
    }

    function toggleTheme() {
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      const newDark = !isCurrentlyDark;
      applyTheme(newDark);
      localStorage.setItem(THEME_STORAGE_KEY, newDark ? 'dark' : 'light');
      showToast(newDark ? '已切换至 极客暗黑 (Cyber Dark) 风格' : '已切换至 清爽浅色 (Classic Light) 风格');
    }

    // 触控数字键盘逻辑
    function pressKeypad(key) {
      const input = document.getElementById('txAmount');
      let val = input.value || '';

      if (key === 'CLEAR') {
        input.value = '';
        return;
      }

      if (key === 'BACKSPACE') {
        input.value = val.slice(0, -1);
        return;
      }

      if (key === '+10') {
        const cur = parseFloat(val) || 0;
        input.value = (cur + 10).toFixed(2);
        return;
      }

      if (key === '+100') {
        const cur = parseFloat(val) || 0;
        input.value = (cur + 100).toFixed(2);
        return;
      }

      if (key === '.') {
        if (!val.includes('.')) {
          input.value = val === '' ? '0.' : val + '.';
        }
        return;
      }

      // 限制小数位最多2位
      if (val.includes('.')) {
        const parts = val.split('.');
        if (parts[1].length >= 2) return;
      }

      if (key === '00') {
        if (val === '' || val === '0') {
          input.value = '0';
        } else if (!val.includes('.') || val.split('.')[1].length === 0) {
          input.value = val + '00';
        }
        return;
      }

      if (val === '0' && key !== '.') {
        input.value = key;
      } else {
        input.value = val + key;
      }
    }

    // 初始化运行
    window.addEventListener('DOMContentLoaded', async () => {
      initTheme();

      document.getElementById('monthPicker').value = currentMonth;
      document.getElementById('monthPicker').addEventListener('change', (e) => {
        currentMonth = e.target.value;
        loadAllData();
      });

      await loadCategories();
      await loadAllData();
      lucide.createIcons();
    });

    async function loadAllData() {
      await Promise.all([
        loadMonthOverview(),
        loadCategoryDistribution(),
        loadTransactions()
      ]);
      lucide.createIcons();
    }

    // 格式化货币
    function formatMoney(amount) {
      return '¥' + Number(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // 数字滚动跳动感视觉触发
    function triggerNumberBounce(el) {
      if (!el) return;
      el.classList.remove('bump');
      void el.offsetWidth; // 触发 reflow
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 250);
    }

    // 提示 Toast (极客终端风格反馈)
    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMsg');
      const toastIcon = document.getElementById('toastIcon');
      const toastTag = document.getElementById('toastTag');

      toastMsg.innerText = msg;
      if (isError) {
        toastTag.className = 'text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/50 font-bold font-num uppercase';
        toastTag.innerText = 'ERR';
        toastIcon.setAttribute('data-lucide', 'alert-circle');
        toastIcon.className = 'w-4 h-4 text-rose-400 shrink-0';
      } else {
        toastTag.className = 'text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/50 font-bold font-num uppercase';
        toastTag.innerText = 'SYS';
        toastIcon.setAttribute('data-lucide', 'check-circle');
        toastIcon.className = 'w-4 h-4 text-cyan-400 shrink-0';
      }
      lucide.createIcons();

      toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
      setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
      }, 3000);
    }

    // 获取并渲染分类
    async function loadCategories() {
      try {
        const res = await fetch('/api/v1/categories');
        const json = await res.json();
        if (json.success) {
          allCategories = json.data;
          renderCategoryFilter();
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderCategoryFilter() {
      const select = document.getElementById('filterCategory');
      select.innerHTML = '<option value="">全部分类</option>';
      allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.innerText = \`\${cat.name} (\${cat.type === 'EXPENSE' ? '支' : '收'})\`;
        select.appendChild(opt);
      });
    }

    // 获取月度看板数据
    async function loadMonthOverview() {
      try {
        const res = await fetch(\`/api/v1/stats/overview?month=\${currentMonth}\`);
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          const expEl = document.getElementById('statExpense');
          const incEl = document.getElementById('statIncome');
          const balEl = document.getElementById('statBalance');

          expEl.innerText = formatMoney(d.totalExpense);
          incEl.innerText = formatMoney(d.totalIncome);
          balEl.innerText = formatMoney(d.balance);
          document.getElementById('statTxCount').innerText = \`共 \${d.transactionCount} 笔明细\`;

          triggerNumberBounce(balEl);
          triggerNumberBounce(expEl);
          triggerNumberBounce(incEl);
        }
      } catch (err) {
        console.error(err);
      }
    }

    // 获取分类占比数据
    async function loadCategoryDistribution() {
      try {
        const res = await fetch(\`/api/v1/stats/category-distribution?month=\${currentMonth}&type=EXPENSE\`);
        const json = await res.json();
        const container = document.getElementById('categoryDistributionContainer');
        if (json.success && json.data.items.length > 0) {
          const items = json.data.items;
          container.innerHTML = items.map(it => \`
            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 font-medium">
                  <span class="w-2.5 h-2.5 rounded-full shadow-xs" style="background-color: \${it.color}; box-shadow: 0 0 6px \${it.color}"></span>
                  <span class="truncate max-w-[120px] sm:max-w-none">\${it.categoryName}</span>
                </span>
                <span class="text-slate-900 dark:text-cyan-300 font-bold font-num">\${formatMoney(it.amount)} <span class="text-slate-400 dark:text-slate-500 font-normal">(\${(it.percentage * 100).toFixed(1)}%)</span></span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden border border-transparent dark:border-slate-700/50">
                <div class="h-full rounded-full transition-all duration-500" style="width: \${it.percentage * 100}%; background-color: \${it.color}; box-shadow: 0 0 8px \${it.color}"></div>
              </div>
            </div>
          \`).join('');
        } else {
          container.innerHTML = '<p class="text-sm text-slate-400 dark:text-slate-500 py-3 text-center">本月暂无支出分类明细</p>';
        }
      } catch (err) {
        console.error(err);
      }
    }

    // 加载账单明细流水 (移动端卡片化优雅排布)
    async function loadTransactions() {
      const type = document.getElementById('filterType').value;
      const catId = document.getElementById('filterCategory').value;
      const container = document.getElementById('transactionList');

      let url = \`/api/v1/transactions?month=\${currentMonth}&pageSize=100\`;
      if (type !== 'ALL') url += \`&type=\${type}\`;
      if (catId) url += \`&categoryId=\${catId}\`;

      try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          const items = json.data.items;
          if (items.length === 0) {
            container.innerHTML = \`
              <div class="py-12 text-center text-slate-400 dark:text-slate-500">
                <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">本月暂无记账流水，点击“+”开始记一笔</p>
              </div>
            \`;
          } else {
            container.innerHTML = items.map(tx => {
              const isExp = tx.type === 'EXPENSE';
              const sign = isExp ? '-' : '+';
              const amtColor = isExp ? 'text-rose-600 dark:text-[#FF2A6D] dark:drop-shadow-[0_0_6px_rgba(255,42,109,0.4)]' : 'text-emerald-600 dark:text-[#05D9E8] dark:drop-shadow-[0_0_6px_rgba(5,217,232,0.4)]';
              const timeStr = new Date(tx.transactionTime).toLocaleString('zh-CN', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
              });

              return \`
                <div class="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between group">
                  <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border border-transparent dark:border-current/30" style="background-color: \${tx.category.color}15; color: \${tx.category.color}; box-shadow: 0 0 10px \${tx.category.color}25">
                      <i data-lucide="\${tx.category.icon.toLowerCase()}" class="w-5 h-5"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 flex-wrap">
                        <span class="truncate">\${tx.category.name}</span>
                        \${tx.note ? \`<span class="text-[11px] font-normal text-slate-500 dark:text-cyan-300/80 bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-transparent dark:border-cyan-500/30 truncate max-w-[140px] sm:max-w-xs">\${tx.note}</span>\` : ''}
                      </div>
                      <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-num">\${timeStr}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2 sm:space-x-3 shrink-0 ml-2">
                    <span class="text-base sm:text-lg font-extrabold font-num \${amtColor}">\${sign}\${formatMoney(tx.amount)}</span>
                    <button onclick="deleteTransaction('\${tx.id}')" title="删除明细" class="opacity-80 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-[#FF2A6D] p-2 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="删除账单">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              \`;
            }).join('');
          }
        }
      } catch (err) {
        console.error(err);
      }
      lucide.createIcons();
    }

    // 记账弹窗控制
    function openTransactionModal() {
      document.getElementById('txId').value = '';
      document.getElementById('txModalTitle').innerText = '记一笔账';
      document.getElementById('txAmount').value = '';
      document.getElementById('txNote').value = '';
      // 当前本地时间格式化为 input datetime-local
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('txTime').value = now.toISOString().slice(0, 16);

      switchTxType('EXPENSE');
      document.getElementById('txModal').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeTransactionModal() {
      document.getElementById('txModal').classList.add('hidden');
    }

    function switchTxType(type) {
      selectedTxType = type;
      const btnExp = document.getElementById('tabExpense');
      const btnInc = document.getElementById('tabIncome');

      if (type === 'EXPENSE') {
        btnExp.className = 'py-2.5 sm:py-2 rounded-lg bg-rose-500 text-white shadow-xs dark:bg-[#FF2A6D] dark:shadow-[0_0_12px_rgba(255,42,109,0.5)] transition-all font-num';
        btnInc.className = 'py-2.5 sm:py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all font-num';
      } else {
        btnInc.className = 'py-2.5 sm:py-2 rounded-lg bg-emerald-500 text-white shadow-xs dark:bg-[#05D9E8] dark:text-[#0B0F17] dark:shadow-[0_0_12px_rgba(5,217,232,0.5)] transition-all font-num';
        btnExp.className = 'py-2.5 sm:py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all font-num';
      }

      renderTxCategoryGrid();
    }

    function renderTxCategoryGrid() {
      const grid = document.getElementById('txCategoryGrid');
      const filtered = allCategories.filter(c => c.type === selectedTxType);
      if (filtered.length > 0 && (!selectedCatId || !filtered.some(c => c.id === selectedCatId))) {
        selectedCatId = filtered[0].id;
      }

      grid.innerHTML = filtered.map(cat => {
        const isSelected = cat.id === selectedCatId;
        const borderClass = isSelected
          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-cyan-400 dark:bg-cyan-950/60 dark:text-cyan-300 dark:shadow-[0_0_10px_rgba(5,217,232,0.3)] font-bold'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300';
        return \`
          <button type="button" onclick="selectTxCategory('\${cat.id}')" class="p-2 sm:p-2 border rounded-xl flex flex-col items-center justify-center space-y-1 text-xs transition-all min-h-[50px] \${borderClass}">
            <i data-lucide="\${cat.icon.toLowerCase()}" class="w-4 h-4" style="color: \${cat.color}"></i>
            <span class="truncate w-full text-center font-num text-[11px] sm:text-xs">\${cat.name}</span>
          </button>
        \`;
      }).join('');
      lucide.createIcons();
    }

    function selectTxCategory(id) {
      selectedCatId = id;
      renderTxCategoryGrid();
    }

    // 提交保存记账
    async function submitTransaction(e) {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('txAmount').value);
      const timeVal = document.getElementById('txTime').value;
      const note = document.getElementById('txNote').value;

      if (!selectedCatId) {
        showToast('请选择记账分类', true);
        return;
      }

      try {
        const res = await fetch('/api/v1/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: selectedTxType,
            amount: amount,
            categoryId: selectedCatId,
            transactionTime: new Date(timeVal).toISOString(),
            note: note
          })
        });

        const json = await res.json();
        if (json.success) {
          showToast('记账保存成功！[TRANSACTION_SAVED]');
          closeTransactionModal();
          await loadAllData();
        } else {
          showToast(json.error?.message || '保存失败', true);
        }
      } catch (err) {
        showToast('请求失败，请检查网络', true);
      }
    }

    // 删除流水
    async function deleteTransaction(id) {
      if (!confirm('确认删除本条记账记录？')) return;
      try {
        const res = await fetch(\`/api/v1/transactions/\${id}\`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          showToast('删除记录成功 [RECORD_PURGED]');
          await loadAllData();
        } else {
          showToast(json.error?.message || '删除失败', true);
        }
      } catch (err) {
        showToast('删除失败', true);
      }
    }

    // 分类管理弹窗控制
    function openCategoryManageModal() {
      renderCategoryModalList();
      document.getElementById('catModal').classList.remove('hidden');
    }

    function closeCategoryManageModal() {
      document.getElementById('catModal').classList.add('hidden');
    }

    function renderCategoryModalList() {
      const container = document.getElementById('catModalList');
      container.innerHTML = allCategories.map(cat => \`
        <div class="py-2.5 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2.5 min-w-0">
            <span class="w-3 h-3 rounded-full shadow-xs shrink-0" style="background-color: \${cat.color}; box-shadow: 0 0 6px \${cat.color}"></span>
            <span class="font-bold text-slate-800 dark:text-slate-100 font-num truncate">\${cat.name}</span>
            <span class="text-slate-400 dark:text-slate-500 font-num shrink-0">(\${cat.type === 'EXPENSE' ? '支出' : '收入'})</span>
            \${cat.isDefault ? '<span class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-cyan-400/80 px-1.5 py-0.5 rounded text-[10px] border border-transparent dark:border-cyan-500/30 font-num shrink-0">内置预设</span>' : ''}
          </div>
          <div class="flex items-center space-x-2 shrink-0 ml-2">
            <span class="text-slate-400 dark:text-slate-500 font-num">\${cat.transactionCount} 笔账单</span>
            \${!cat.isDefault ? \`
              <button onclick="deleteCategory('\${cat.id}')" class="text-rose-500 hover:text-rose-700 dark:text-[#FF2A6D] dark:hover:text-rose-400 font-semibold px-2 py-1.5 rounded transition-all font-num min-h-[32px]">删除</button>
            \` : ''}
          </div>
        </div>
      \`).join('');
    }

    // 新增分类
    async function submitNewCategory(e) {
      e.preventDefault();
      const type = document.getElementById('newCatType').value;
      const name = document.getElementById('newCatName').value;
      const icon = document.getElementById('newCatIcon').value;
      const color = document.getElementById('newCatColor').value;

      try {
        const res = await fetch('/api/v1/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, name, icon, color })
        });
        const json = await res.json();
        if (json.success) {
          showToast('新增分类成功！[CATEGORY_CREATED]');
          document.getElementById('newCatName').value = '';
          await loadCategories();
          renderCategoryModalList();
        } else {
          showToast(json.error?.message || '新增失败', true);
        }
      } catch (err) {
        showToast('新增分类异常', true);
      }
    }

    // 删除分类（防删保护）
    async function deleteCategory(id) {
      if (!confirm('确认删除该分类？')) return;
      try {
        const res = await fetch(\`/api/v1/categories/\${id}\`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          showToast('分类删除成功 [CATEGORY_REMOVED]');
          await loadCategories();
          renderCategoryModalList();
        } else {
          // 捕获 409 关联拦截
          alert(json.error?.message || '删除失败');
        }
      } catch (err) {
        showToast('删除请求失败', true);
      }
    }
  </script>
</body>
</html>`;
