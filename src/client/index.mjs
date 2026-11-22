/**
 * 极简现代响应式前端单页应用 (Single File SPA)
 * 集成 Tailwind CSS + Lucide Icons + 首页看板 + 快速记账 + 账单明细 + 分类管理
 */

export const HTML_CLIENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>个人记账本 - MVP</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      font-feature-settings: "tnum";
      -webkit-font-smoothing: antialiased;
      background-color: #F8FAFC;
    }
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
  </style>
</head>
<body class="text-slate-800 antialiased flex flex-col min-h-screen">

  <!-- 顶部导航栏 -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <i data-lucide="wallet" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-900 leading-none">个人记账本</h1>
          <p class="text-xs text-slate-500 mt-1">智能·清晰·分单位无损记账</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <!-- 月份切换 -->
        <input type="month" id="monthPicker" class="text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
        <!-- 记账快捷触发按钮 -->
        <button onclick="openTransactionModal()" class="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>记一笔</span>
        </button>
      </div>
    </div>
  </header>

  <!-- 主体内容容器 -->
  <main class="max-w-4xl mx-auto px-4 py-6 w-full flex-1 space-y-6">

    <!-- 1. 核心看板概览卡片 (Dashboard Overview) -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 当月净结余卡片 -->
      <div class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/15 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 opacity-15">
          <i data-lucide="scale" class="w-28 h-28"></i>
        </div>
        <p class="text-xs font-medium text-blue-100 uppercase tracking-wider">当月净结余 (Balance)</p>
        <div id="statBalance" class="text-3xl font-black mt-2 tracking-tight">¥0.00</div>
        <div class="mt-3 flex items-center text-xs text-blue-100">
          <span id="statTxCount">共 0 笔明细</span>
        </div>
      </div>

      <!-- 月度总支出卡片 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">本月总支出</span>
          <span class="w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
          </span>
        </div>
        <div id="statExpense" class="text-2xl font-bold text-rose-600 mt-2">¥0.00</div>
        <p class="text-xs text-slate-400 mt-2">严格采用整型分计算</p>
      </div>

      <!-- 月度总收入卡片 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">本月总收入</span>
          <span class="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i data-lucide="arrow-down-left" class="w-4 h-4"></i>
          </span>
        </div>
        <div id="statIncome" class="text-2xl font-bold text-emerald-600 mt-2">¥0.00</div>
        <p class="text-xs text-slate-400 mt-2">资金流水健康度良好</p>
      </div>
    </section>

    <!-- 2. 分类支出占比与统计进度 -->
    <section class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <i data-lucide="pie-chart" class="w-5 h-5 text-blue-600"></i>
          <h2 class="text-base font-bold text-slate-900">支出分类分布</h2>
        </div>
        <button onclick="openCategoryManageModal()" class="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
          <i data-lucide="settings" class="w-3.5 h-3.5"></i>
          <span>分类管理</span>
        </button>
      </div>
      <div id="categoryDistributionContainer" class="space-y-3">
        <!-- 动态渲染分类条 -->
        <p class="text-sm text-slate-400 py-3 text-center">暂无支出数据</p>
      </div>
    </section>

    <!-- 3. 账单流水列表明细 (Transactions) -->
    <section class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center space-x-2">
          <i data-lucide="receipt-text" class="w-5 h-5 text-blue-600"></i>
          <h2 class="text-base font-bold text-slate-900">账单明细流水</h2>
        </div>
        <!-- 筛选过滤器 -->
        <div class="flex items-center space-x-2">
          <select id="filterType" onchange="loadTransactions()" class="text-xs font-medium bg-slate-100 text-slate-700 border-0 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500">
            <option value="ALL">全部收支</option>
            <option value="EXPENSE">仅支出</option>
            <option value="INCOME">仅收入</option>
          </select>
          <select id="filterCategory" onchange="loadTransactions()" class="text-xs font-medium bg-slate-100 text-slate-700 border-0 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500">
            <option value="">全部分类</option>
          </select>
        </div>
      </div>

      <!-- 明细列表流 -->
      <div id="transactionList" class="divide-y divide-slate-100">
        <div class="py-12 text-center text-slate-400 text-sm">加载中...</div>
      </div>
    </section>

  </main>

  <!-- 记账弹窗表单 Modal -->
  <div id="txModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 hidden">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 id="txModalTitle" class="text-base font-bold text-slate-900">记一笔账</h3>
        <button onclick="closeTransactionModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="txForm" onsubmit="submitTransaction(event)" class="p-5 space-y-4">
        <input type="hidden" id="txId">

        <!-- 收支类型切换 Switch -->
        <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-center font-semibold text-sm">
          <button type="button" id="tabExpense" onclick="switchTxType('EXPENSE')" class="py-2 rounded-lg bg-rose-500 text-white shadow-xs transition-all">
            支出 (Expense)
          </button>
          <button type="button" id="tabIncome" onclick="switchTxType('INCOME')" class="py-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all">
            收入 (Income)
          </button>
        </div>

        <!-- 金额输入与精度校验 -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">金额 (元)</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">¥</span>
            <input type="number" step="0.01" min="0.01" max="999999999.99" required id="txAmount" placeholder="0.00" class="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
          </div>
          <p class="text-[11px] text-slate-400 mt-1">底层采用以分为单位整型存储，杜绝浮点精度丢失</p>
        </div>

        <!-- 分类选择网格 -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1.5">选择分类</label>
          <div id="txCategoryGrid" class="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 scrollbar-none">
            <!-- 动态分类按钮 -->
          </div>
        </div>

        <!-- 记账时间与备注 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">交易时间</label>
            <input type="datetime-local" id="txTime" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">备注说明 (选填)</label>
            <input type="text" id="txNote" maxlength="100" placeholder="如午餐聚会/奖金" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <div class="pt-2 flex items-center space-x-3">
          <button type="button" onclick="closeTransactionModal()" class="w-1/3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm rounded-xl transition-all">取消</button>
          <button type="submit" class="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/30 transition-all">保存账单</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 分类管理弹窗 Modal -->
  <div id="catModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 hidden">
    <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-900">分类管理</h3>
          <p class="text-xs text-slate-400 mt-0.5">支持自定义分类与防删保护拦截</p>
        </div>
        <button onclick="closeCategoryManageModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- 分类创建表单 -->
      <div class="p-4 bg-slate-50 border-b border-slate-200">
        <form onsubmit="submitNewCategory(event)" class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <select id="newCatType" class="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2">
              <option value="EXPENSE">支出分类</option>
              <option value="INCOME">收入分类</option>
            </select>
            <input type="text" id="newCatName" placeholder="分类名称(如猫粮)" required maxlength="20" class="col-span-2 text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-2">
          </div>
          <div class="flex items-center space-x-2">
            <input type="text" id="newCatIcon" placeholder="Lucide图标名(如Cat/Coffee)" value="Tag" required class="flex-1 text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-2">
            <input type="color" id="newCatColor" value="#3B82F6" class="w-9 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all">
              + 添加分类
            </button>
          </div>
        </form>
      </div>

      <!-- 分类列表 -->
      <div id="catModalList" class="p-4 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-2">
        <!-- 动态生成 -->
      </div>
    </div>
  </div>

  <!-- Toast 轻提示 -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm flex items-center space-x-2 transition-all transform translate-y-20 opacity-0 pointer-events-none">
    <i id="toastIcon" data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
    <span id="toastMsg">操作成功</span>
  </div>

  <script>
    // 状态管理
    let currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    let allCategories = [];
    let selectedTxType = 'EXPENSE';
    let selectedCatId = null;

    // 初始化运行
    window.addEventListener('DOMContentLoaded', async () => {
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

    // 提示 Toast
    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMsg');
      const toastIcon = document.getElementById('toastIcon');

      toastMsg.innerText = msg;
      if (isError) {
        toastIcon.setAttribute('data-lucide', 'alert-circle');
        toastIcon.className = 'w-4 h-4 text-rose-400';
      } else {
        toastIcon.setAttribute('data-lucide', 'check-circle');
        toastIcon.className = 'w-4 h-4 text-emerald-400';
      }
      lucide.createIcons();

      toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
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
          document.getElementById('statExpense').innerText = formatMoney(d.totalExpense);
          document.getElementById('statIncome').innerText = formatMoney(d.totalIncome);
          
          const balEl = document.getElementById('statBalance');
          balEl.innerText = formatMoney(d.balance);
          document.getElementById('statTxCount').innerText = \`共 \${d.transactionCount} 笔明细\`;
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
                <span class="text-slate-700 flex items-center space-x-1.5">
                  <span class="w-2.5 h-2.5 rounded-full" style="background-color: \${it.color}"></span>
                  <span>\${it.categoryName}</span>
                </span>
                <span class="text-slate-900 font-bold">\${formatMoney(it.amount)} <span class="text-slate-400 font-normal">(\${(it.percentage * 100).toFixed(1)}%)</span></span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="width: \${it.percentage * 100}%; background-color: \${it.color}"></div>
              </div>
            </div>
          \`).join('');
        } else {
          container.innerHTML = '<p class="text-sm text-slate-400 py-3 text-center">本月暂无支出分类明细</p>';
        }
      } catch (err) {
        console.error(err);
      }
    }

    // 加载账单明细流水
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
              <div class="py-12 text-center text-slate-400">
                <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">本月暂无记账流水，点击右上角“记一笔”开始记录</p>
              </div>
            \`;
          } else {
            container.innerHTML = items.map(tx => {
              const isExp = tx.type === 'EXPENSE';
              const sign = isExp ? '-' : '+';
              const amtColor = isExp ? 'text-rose-600' : 'text-emerald-600';
              const timeStr = new Date(tx.transactionTime).toLocaleString('zh-CN', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
              });

              return \`
                <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs" style="background-color: \${tx.category.color}15; color: \${tx.category.color}">
                      <i data-lucide="\${tx.category.icon.toLowerCase()}" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <div class="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <span>\${tx.category.name}</span>
                        \${tx.note ? \`<span class="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">\${tx.note}</span>\` : ''}
                      </div>
                      <div class="text-xs text-slate-400 mt-0.5">\${timeStr}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="text-base font-extrabold \${amtColor}">\${sign}\${formatMoney(tx.amount)}</span>
                    <button onclick="deleteTransaction('\${tx.id}')" title="删除明细" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-all">
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
        btnExp.className = 'py-2 rounded-lg bg-rose-500 text-white shadow-xs transition-all';
        btnInc.className = 'py-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all';
      } else {
        btnInc.className = 'py-2 rounded-lg bg-emerald-500 text-white shadow-xs transition-all';
        btnExp.className = 'py-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all';
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
        const borderClass = isSelected ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700';
        return \`
          <button type="button" onclick="selectTxCategory('\${cat.id}')" class="p-2 border rounded-xl flex flex-col items-center justify-center space-y-1 text-xs transition-all \${borderClass}">
            <i data-lucide="\${cat.icon.toLowerCase()}" class="w-4 h-4" style="color: \${cat.color}"></i>
            <span class="truncate w-full text-center">\${cat.name}</span>
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
          showToast('记账保存成功！');
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
          showToast('删除记录成功');
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
          <div class="flex items-center space-x-2.5">
            <span class="w-3 h-3 rounded-full" style="background-color: \${cat.color}"></span>
            <span class="font-bold text-slate-800">\${cat.name}</span>
            <span class="text-slate-400">(\${cat.type === 'EXPENSE' ? '支出' : '收入'})</span>
            \${cat.isDefault ? '<span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">内置预设</span>' : ''}
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-slate-400">\${cat.transactionCount} 笔账单</span>
            \${!cat.isDefault ? \`
              <button onclick="deleteCategory('\${cat.id}')" class="text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded">删除</button>
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
          showToast('新增分类成功！');
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
          showToast('分类删除成功');
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
