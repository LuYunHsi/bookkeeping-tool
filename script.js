<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="網頁版記帳網站，支援本地儲存、圖表分析與理財建議。" />
  <title>記帳小幫手</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      color-scheme: light;
    }

    body {
      background:
        radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 28%),
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 24%),
        linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    }

    .glass-card {
      backdrop-filter: blur(14px);
      background: rgba(255, 255, 255, 0.82);
    }
  </style>
</head>
<body class="min-h-screen text-slate-800">
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <header class="mb-6 overflow-hidden rounded-3xl border border-white/70 bg-slate-950 text-white shadow-2xl shadow-slate-900/10">
      <div class="grid gap-6 px-6 py-8 md:grid-cols-[1.3fr_0.7fr] md:px-10 md:py-10">
        <div>
          <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-amber-200">Vanilla JS · localStorage · Chart.js</span>
          <h1 class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">記帳小幫手</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            一個單頁式的網頁版記帳網站，整合儀表板、表單、歷史清單與理財建議，方便你快速記錄每一筆收入與支出。
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
          <article class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p class="text-xs text-slate-300">本月總收入</p>
            <p id="summaryIncome" class="mt-2 text-2xl font-semibold">$0</p>
          </article>
          <article class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p class="text-xs text-slate-300">本月總支出</p>
            <p id="summaryExpense" class="mt-2 text-2xl font-semibold">$0</p>
          </article>
          <article class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p class="text-xs text-slate-300">剩餘預算</p>
            <p id="summaryBalance" class="mt-2 text-2xl font-semibold">$0</p>
          </article>
        </div>
      </div>
    </header>

    <main class="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <section class="space-y-6">
        <section class="glass-card rounded-3xl border border-white/70 p-5 shadow-xl shadow-slate-900/5 sm:p-6">
          <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">儀表板</h2>
              <p class="mt-1 text-sm text-slate-500">檢視本月收支、分類分布與趨勢變化。</p>
            </div>
            <div class="w-full max-w-sm">
              <div class="mb-2 flex items-center justify-between text-sm">
                <span class="font-medium text-slate-600">預算進度</span>
                <span id="budgetText" class="font-semibold text-slate-900">$0 / $0</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-slate-200">
                <div id="budgetBar" class="h-full w-0 rounded-full bg-emerald-500 transition-all duration-300"></div>
              </div>
              <p id="budgetHint" class="mt-2 text-xs text-slate-500">尚未設定每月預算。</p>
            </div>
          </div>
          <div class="grid gap-5 lg:grid-cols-2">
            <article class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-semibold text-slate-900">支出分類圓餅圖</h3>
              </div>
              <div class="h-72">
                <canvas id="expenseCategoryChart"></canvas>
              </div>
            </article>
            <article class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-semibold text-slate-900">每月收支趨勢</h3>
              </div>
              <div class="h-72">
                <canvas id="monthlyTrendChart"></canvas>
              </div>
            </article>
          </div>
        </section>

        <section class="glass-card rounded-3xl border border-white/70 p-5 shadow-xl shadow-slate-900/5 sm:p-6">
          <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">記帳表單</h2>
              <p class="mt-1 text-sm text-slate-500">快速新增一筆收入或支出，資料會儲存在瀏覽器 localStorage。</p>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-700">每月總預算</span>
                <input id="budgetInput" type="number" min="0" step="1" class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" placeholder="例如 30000" />
              </label>
              <button id="saveBudgetBtn" type="button" class="mt-auto rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">儲存預算</button>
            </div>
          </div>

          <form id="transactionForm" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">日期</span>
              <input id="dateInput" type="date" class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">流向</span>
              <select id="typeInput" class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">分類</span>
              <select id="categoryInput" class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"></select>
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">金額</span>
              <input id="amountInput" type="number" min="0" step="1" inputmode="numeric" class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" placeholder="0" />
            </label>

            <label class="block md:col-span-2 xl:col-span-2">
              <span class="mb-1 block text-sm font-medium text-slate-700">備註</span>
              <input id="noteInput" type="text" class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" placeholder="例如：午餐、薪資入帳" />
            </label>

            <div class="flex items-end">
              <button type="submit" class="w-full rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">儲存紀錄</button>
            </div>
          </form>
        </section>
      </section>

      <aside class="space-y-6">
        <section class="glass-card rounded-3xl border border-white/70 p-5 shadow-xl shadow-slate-900/5 sm:p-6">
          <h2 class="text-xl font-semibold text-slate-900">歷史清單</h2>
          <p class="mt-1 text-sm text-slate-500">可依日、週、月切換檢視流水帳。</p>

          <div class="mt-4 flex flex-wrap gap-2">
            <button class="filter-btn rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" data-range="day">日</button>
            <button class="filter-btn rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700" data-range="week">週</button>
            <button class="filter-btn rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700" data-range="month">月</button>
          </div>

          <div class="mt-5 max-h-[540px] space-y-3 overflow-auto pr-1" id="historyList">
            <p class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">目前尚無流水帳，先從左側表單新增第一筆記錄。</p>
          </div>
        </section>

        <section class="glass-card rounded-3xl border border-white/70 p-5 shadow-xl shadow-slate-900/5 sm:p-6">
          <h2 class="text-xl font-semibold text-slate-900">理財建議</h2>
          <p id="insightsText" class="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            先建立一筆收入與支出，系統會根據你的消費結構提供提醒。
          </p>
        </section>
      </aside>
    </main>
  </div>

  <script src="script.js" defer></script>
</body>
</html>
