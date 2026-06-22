// ==========================================
// 1. 初始化與全域變數設定
// ==========================================
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let monthlyBudget = Number(localStorage.getItem('monthlyBudget')) || 0;
let currentFilter = 'month'; // 預設篩選「月」

// 定義分類項目
const categories = {
    expense: ['三餐', '飲品', '點心', '交通', '購物', '娛樂', '日用品', '房租', '醫療', '禮物', '數位', '生活', '其他'],
    income: ['薪資', '獎金', '投資', '零用錢', '其他']
};

// 取得 HTML 元素節點
const transactionForm = document.getElementById('transactionForm');
const dateInput = document.getElementById('dateInput');
const typeInput = document.getElementById('typeInput');
const categoryInput = document.getElementById('categoryInput');
const amountInput = document.getElementById('amountInput');
const noteInput = document.getElementById('noteInput');

const budgetInput = document.getElementById('budgetInput');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');
const budgetText = document.getElementById('budgetText');
const budgetBar = document.getElementById('budgetBar');
const budgetHint = document.getElementById('budgetHint');

const summaryIncome = document.getElementById('summaryIncome');
const summaryExpense = document.getElementById('summaryExpense');
const summaryBalance = document.getElementById('summaryBalance');
const historyList = document.getElementById('historyList');
const insightsText = document.getElementById('insightsText');

// 圖表物件變數（用來防止圖表重複渲染重疊）
let expensePieChart = null;
let trendLineChart = null;

// ==========================================
// 2. 核心功能：動態渲染分類選單 (關鍵修正點！)
// ==========================================
function updateCategoryOptions() {
    const selectedType = typeInput.value; // expense 或 income
    const options = categories[selectedType];
    
    // 清空舊選項，並動態填入新選項
    categoryInput.innerHTML = options.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// 監聽「流向」切換事件（切換支出/收入時，連動改變分類）
typeInput.addEventListener('change', updateCategoryOptions);

// 預設將日期設定為今天
dateInput.value = new Date().toISOString().split('T')[0];

// ==========================================
// 3. 資料處理與統計計算
// ==========================================
function getFilteredData() {
    const now = new Date();
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        if (currentFilter === 'day') {
            return tDate.toDateString() === now.toDateString();
        } else if (currentFilter === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return tDate >= oneWeekAgo && tDate <= now;
        } else { // month
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        }
    });
}

function updateDashboard() {
    const filteredData = getFilteredData();
    
    // 計算收支
    const totalIncome = filteredData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // 更新上方數字卡片
    summaryIncome.textContent = `$${totalIncome.toLocaleString()}`;
    summaryExpense.textContent = `$${totalExpense.toLocaleString()}`;
    summaryBalance.textContent = `$${balance.toLocaleString()}`;

    // 更新預算進度條
    budgetText.textContent = `$${totalExpense.toLocaleString()} / $${monthlyBudget.toLocaleString()}`;
    if (monthlyBudget > 0) {
        const percent = Math.min((totalExpense / monthlyBudget) * 100, 100);
        budgetBar.style.width = `${percent}%`;
        
        // 顏色警示邏輯
        if (percent >= 100) {
            budgetBar.className = "h-full rounded-full bg-red-500 transition-all duration-300";
            budgetHint.textContent = "⚠️ 預算已破表！請節制消費。";
            budgetHint.className = "mt-2 text-xs text-red-500 font-semibold";
        } else if (percent >= 80) {
            budgetBar.className = "h-full rounded-full bg-amber-500 transition-all duration-300";
            budgetHint.textContent = "🚨 支出已達預算 80%，請注意花費。";
            budgetHint.className = "mt-2 text-xs text-amber-500 font-semibold";
        } else {
            budgetBar.className = "h-full rounded-full bg-emerald-500 transition-all duration-300";
            budgetHint.textContent = "💰 目前預算控制良好。";
            budgetHint.className = "mt-2 text-xs text-emerald-500";
        }
    } else {
        budgetBar.style.width = '0%';
        budgetHint.textContent = "尚未設定每月預算。";
        budgetHint.className = "mt-2 text-xs text-slate-500";
    }

    renderHistoryList(filteredData);
    renderCharts(filteredData);
    generateInsights(filteredData, totalIncome, totalExpense);
}

// ==========================================
// 4. 歷史清單渲染與刪除
// ==========================================
function renderHistoryList(data) {
    if (data.length === 0) {
        historyList.innerHTML = `<p class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">目前尚無流水帳紀錄。</p>`;
        return;
    }

    // 按日期倒序排列
    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

    historyList.innerHTML = sortedData.map(t => `
        <div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="inline-block rounded-lg px-2 py-0.5 text-xs font-medium ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                        ${t.category}
                    </span>
                    <span class="text-xs text-slate-400">${t.date}</span>
                </div>
                <p class="text-sm font-medium text-slate-700">${t.note || '無備註'}</p>
            </div>
            <div class="flex items-center gap-4">
                <span class="text-base font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}">
                    ${t.type === 'income' ? '+' : '-'}$${t.amount}
                </span>
                <button onclick="deleteTransaction('${t.id}')" class="text-xs font-medium text-slate-400 hover:text-rose-500 transition">刪除</button>
            </div>
        </div>
    `).join('');
}

window.deleteTransaction = function(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateDashboard();
};

// ==========================================
// 5. 智慧理財建議
// ==========================================
function generateInsights(data, income, expense) {
    if (data.length === 0) {
        insightsText.textContent = "先建立一筆收入與支出，系統會根據你的消費結構提供提醒。";
        insightsText.className = "mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900";
        return;
    }

    // 計算 飲品+點心 的比例
    const snackDrinkExpense = data
        .filter(t => t.type === 'expense' && (t.category === '飲品' || t.category === '點心'))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const snackPercent = expense > 0 ? (snackDrinkExpense / expense) * 100 : 0;

    if (expense > income && income > 0) {
        insightsText.textContent = "❌ 本月入不敷出！支出大於收入，建議立刻調降「購物」與「娛樂」的非必要預算。";
        insightsText.className = "mt-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-900 font-medium";
    } else if (snackPercent > 15) {
        insightsText.textContent = `🧋 偵測到本月「飲品+點心」佔了總支出的 ${snackPercent.toFixed(1)}%！減少手搖飲與下午茶，一個月可以幫你多存下不少錢喔！`;
        insightsText.className = "mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900 font-medium";
    } else {
        insightsText.textContent = "✅ 太棒了！本月財務狀況控制良好，收支比例與預算都在安全範圍內，請繼續保持！";
        insightsText.className = "mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 font-medium";
    }
}

// ==========================================
// 6. Chart.js 圖表數據渲染
// ==========================================
function renderCharts(data) {
    // ---- 1. 圓餅圖數據處理 ----
    const expenseData = data.filter(t => t.type === 'expense');
    const catTotals = {};
    categories.expense.forEach(c => catTotals[c] = 0);
    expenseData.forEach(t => { if(catTotals[t.category] !== undefined) catTotals[t.category] += t.amount; });

    const pieLabels = Object.keys(catTotals).filter(c => catTotals[c] > 0);
    const pieValues = pieLabels.map(c => catTotals[c]);

    if(expensePieChart) expensePieChart.destroy();
    const ctxPie = document.getElementById('expenseCategoryChart').getContext('2d');
    
    if (pieValues.length === 0) {
        ctxPie.clearRect(0, 0, 200, 200); // 沒資料時清空
    } else {
        expensePieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieValues,
                    backgroundColor: ['#f87171', '#fb923c', '#fbbf24', '#facc15', '#4ade80', '#4cc9f0', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#94a3b8', '#cbd5e1']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // ---- 2. 折線圖數據處理 (按日期統計) ----
    const dateMap = {};
    data.forEach(t => {
        if(!dateMap[t.date]) dateMap[t.date] = { income: 0, expense: 0 };
        dateMap[t.date][t.type] += t.amount;
    });
    const sortedDates = Object.keys(dateMap).sort();
    const trendIncome = sortedDates.map(d => dateMap[d].income);
    const trendExpense = sortedDates.map(d => dateMap[d].expense);

    if(trendLineChart) trendLineChart.destroy();
    const ctxTrend = document.getElementById('monthlyTrendChart').getContext('2d');
    
    trendLineChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: sortedDates.map(d => d.slice(5)), // 只顯示月-日
            datasets: [
                { label: '收入', data: trendIncome, borderColor: '#10b981', tension: 0.2, fill: false },
                { label: '支出', data: trendExpense, borderColor: '#ef4444', tension: 0.2, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ==========================================
// 7. 表單提交與事件監聽
// ==========================================
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = Math.floor(Number(amountInput.value));
    if (!dateInput.value || !amount || amount <= 0) {
        alert('請填入正確的日期與大於 0 的金額！');
        return;
    }

    const newTransaction = {
        id: Date.now().toString(),
        date: dateInput.value,
        type: typeInput.value,
        category: categoryInput.value,
        amount: amount,
        note: noteInput.value.trim()
    };

    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // 表單重設
    amountInput.value = '';
    noteInput.value = '';
    
    updateDashboard();
});

// 預算儲存事件
saveBudgetBtn.addEventListener('click', () => {
    const budget = Math.floor(Number(budgetInput.value));
    if (budget < 0) return;
    monthlyBudget = budget;
    localStorage.setItem('monthlyBudget', monthlyBudget);
    budgetInput.value = '';
    updateDashboard();
});

// 日/週/月 篩選按鈕點擊事件
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.className = "filter-btn rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700";
        });
        e.target.className = "filter-btn rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white";
        currentFilter = e.target.dataset.range;
        updateDashboard();
    });
});

// ==========================================
// 8. 網頁初始啟動
// ==========================================
updateCategoryOptions(); // 啟動時先產生一次分類
updateDashboard();       // 渲染儀表板與圖表
