const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const categoryBars = document.getElementById("categoryBars");
const trendChart = document.getElementById("trendChart");
const recurringList = document.getElementById("recurringList");

const formMessage = document.getElementById("formMessage");
const saveExpenseBtn = document.getElementById("saveExpenseBtn");
const refreshBtn = document.getElementById("refreshBtn");
const signOutBtn = document.getElementById("signOutBtn");

const coachFeed = document.getElementById("coachFeed");
const coachForm = document.getElementById("coachForm");
const coachPrompt = document.getElementById("coachPrompt");
const coachStatus = document.getElementById("coachStatus");
const coachSubmitBtn = document.getElementById("coachSubmitBtn");

const walletBalance = document.getElementById("walletBalance");
const monthlySpend = document.getElementById("monthlySpend");
const expenseCount = document.getElementById("expenseCount");
const quickTotal = document.getElementById("quickTotal");
const lastSync = document.getElementById("lastSync");
const dateInput = document.getElementById("date");

const budgetForm = document.getElementById("budgetForm");
const budgetMessage = document.getElementById("budgetMessage");
const budgetSaveBtn = document.getElementById("budgetSaveBtn");
const budgetMonthlyTotalInput = document.getElementById("budgetMonthlyTotal");
const budgetFoodInput = document.getElementById("budgetFood");
const budgetTransportationInput = document.getElementById("budgetTransportation");
const budgetEntertainmentInput = document.getElementById("budgetEntertainment");
const budgetUtilitiesInput = document.getElementById("budgetUtilities");
const budgetOtherInput = document.getElementById("budgetOther");
const budgetMonthlyText = document.getElementById("budgetMonthlyText");
const budgetRemainingText = document.getElementById("budgetRemainingText");
const budgetProgress = document.getElementById("budgetProgress");
const walletForm = document.getElementById("walletForm");
const walletMessage = document.getElementById("walletMessage");
const walletSaveBtn = document.getElementById("walletSaveBtn");
const walletBalanceInput = document.getElementById("walletBalanceInput");

const CATEGORIES = ["Food", "Transportation", "Entertainment", "Utilities", "Other"];
const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let currentExpenses = [];
let currentBudgetGoals = {
  monthlyTotal: 0,
  categories: {},
};
let currentWalletBalance = 0;

dateInput.value = new Date().toISOString().slice(0, 10);

function formatMoney(value) {
  return money.format(Number(value || 0));
}

function formatDate(value) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function setMessage(text, type = "") {
  formMessage.textContent = text;
  formMessage.className = `message${type ? ` ${type}` : ""}`;
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.className = "message";
}

function setCoachStatus(text, type = "") {
  coachStatus.textContent = text;
  coachStatus.className = `message${type ? ` ${type}` : ""}`;
}

function setBudgetMessage(text, type = "") {
  budgetMessage.textContent = text;
  budgetMessage.className = `message${type ? ` ${type}` : ""}`;
}

function setWalletMessage(text, type = "") {
  walletMessage.textContent = text;
  walletMessage.className = `message${type ? ` ${type}` : ""}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function categoryInitial(category) {
  return String(category || "Other").slice(0, 1).toUpperCase();
}

function groupByCategory(expenses) {
  return expenses.reduce((acc, item) => {
    const category = item.category || "Other";
    acc[category] = (acc[category] || 0) + Number(item.amount || 0);
    return acc;
  }, {});
}

function getCurrentMonthTotal(expenses) {
  const now = new Date();

  return expenses
    .filter((item) => {
      const parsed = new Date(item.date || item.createdAt);
      return !Number.isNaN(parsed.getTime()) &&
        parsed.getFullYear() === now.getFullYear() &&
        parsed.getMonth() === now.getMonth();
    })
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getMonthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function renderCoachIntro() {
  coachFeed.innerHTML = `
    <article class="coach-message assistant bubble-enter">
      <h4>Expense coach ready</h4>
      <p>Ask me where you can trim spending, which category is most expensive, or what you should prioritize this month.</p>
      <div class="coach-grid">
        <div class="coach-metric">
          <span>Total tracked</span>
          <strong id="coachTotalTracked">Loading...</strong>
        </div>
        <div class="coach-metric">
          <span>Top category</span>
          <strong id="coachTopCategory">Loading...</strong>
        </div>
      </div>
    </article>
  `;
}

function renderCoachSummary(summary) {
  const totalTrackedEl = document.getElementById("coachTotalTracked");
  const topCategoryEl = document.getElementById("coachTopCategory");

  if (totalTrackedEl) {
    totalTrackedEl.textContent = formatMoney(summary.total);
  }

  if (topCategoryEl) {
    topCategoryEl.textContent = summary.topCategory?.name || "Other";
  }
}

function appendCoachTurn(question, payload, isLoading = false) {
  const userBubble = document.createElement("article");
  userBubble.className = "coach-message user bubble-enter";
  userBubble.innerHTML = `
    <h4>You</h4>
    <p>${escapeHtml(question)}</p>
  `;

  coachFeed.appendChild(userBubble);

  const assistantBubble = document.createElement("article");
  assistantBubble.className = "coach-message assistant bubble-enter";
  assistantBubble.innerHTML = `
    <h4>${isLoading ? "Thinking..." : escapeHtml(payload.headline || "Expense coach")}</h4>
    <p>${isLoading ? "Analyzing your spending pattern..." : escapeHtml(payload.reply || "")}</p>
    <div class="coach-grid">
      <div class="coach-metric">
        <span>Estimated savings</span>
        <strong>${isLoading ? "..." : formatMoney(payload.estimated_savings || 0)}</strong>
      </div>
      <div class="coach-metric">
        <span>Focus area</span>
        <strong>${isLoading ? "..." : escapeHtml((payload.insights && payload.insights[0]) || "Review your highest category")}</strong>
      </div>
    </div>
    ${
      isLoading
        ? ""
        : `
      ${payload.warning ? `<p class="coach-warning">${escapeHtml(payload.warning)}</p>` : ""}
      <div>
        <p class="coach-list-title">Insights</p>
        <ul>
          ${(payload.insights || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
      <div>
        <p class="coach-list-title">Actions</p>
        <ul>
          ${(payload.actions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `
    }
  `;

  coachFeed.appendChild(assistantBubble);
  coachFeed.scrollTop = coachFeed.scrollHeight;
  return assistantBubble;
}

function renderCategoryBars(expenses) {
  const byCategory = groupByCategory(expenses);
  const entries = Object.entries(byCategory);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (!entries.length) {
    categoryBars.innerHTML = '<div class="empty-state">No category data yet.</div>';
    return;
  }

  categoryBars.innerHTML = entries
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => {
      const width = total ? Math.max(8, (amount / total) * 100) : 0;

      return `
        <div class="bar-row">
          <div class="label-row">
            <span>${category}</span>
            <span>${formatMoney(amount)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderList(expenses) {
  if (!expenses.length) {
    expenseList.innerHTML = '<div class="empty-state">No expenses yet. Add your first transaction on the left.</div>';
    return;
  }

  expenseList.innerHTML = expenses
    .slice()
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .map((expense) => {
      const amount = Number(expense.amount || 0);
      const description = expense.description?.trim() || `${expense.category || "Other"} expense`;
      const date = expense.date || expense.createdAt;

      return `
        <article class="expense-item">
          <div class="expense-badge">${categoryInitial(expense.category)}</div>
          <div>
            <h4>${expense.title}</h4>
            <p>${description}</p>
          </div>
          <div class="expense-meta">
            <strong>${formatMoney(amount)}</strong>
            <span>${expense.category || "Other"} | ${formatDate(date)}</span>
            <div class="expense-actions">
              <button class="item-btn" type="button" data-action="edit" data-id="${expense._id}">Edit</button>
              <button class="item-btn danger" type="button" data-action="delete" data-id="${expense._id}">Delete</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateSummary(expenses) {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthlyTotal = getCurrentMonthTotal(expenses);

  walletBalance.textContent = formatMoney(currentWalletBalance);
  monthlySpend.textContent = formatMoney(monthlyTotal);
  expenseCount.textContent = String(expenses.length);
  quickTotal.textContent = formatMoney(total);
}

function renderWalletBalance(value) {
  const parsed = Number(value || 0);
  currentWalletBalance = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  walletBalance.textContent = formatMoney(currentWalletBalance);
  walletBalanceInput.value = currentWalletBalance ? String(currentWalletBalance) : "";
}

function renderBudgetCard(expenses, budgetGoals) {
  const monthlyBudget = Number(budgetGoals?.monthlyTotal || 0);
  const currentMonthTotal = getCurrentMonthTotal(expenses);
  const remaining = monthlyBudget - currentMonthTotal;
  const progress = monthlyBudget > 0 ? Math.min(100, (currentMonthTotal / monthlyBudget) * 100) : 0;

  budgetMonthlyText.textContent = formatMoney(monthlyBudget);
  budgetRemainingText.textContent = formatMoney(remaining);
  budgetProgress.style.width = `${progress}%`;

  budgetMonthlyTotalInput.value = monthlyBudget ? String(monthlyBudget) : "";
  for (const category of CATEGORIES) {
    const input = getBudgetCategoryInput(category);
    if (input) {
      input.value = Number(budgetGoals?.categories?.[category] || 0) || "";
    }
  }
}

function getBudgetCategoryInput(category) {
  return {
    Food: budgetFoodInput,
    Transportation: budgetTransportationInput,
    Entertainment: budgetEntertainmentInput,
    Utilities: budgetUtilitiesInput,
    Other: budgetOtherInput,
  }[category];
}

function renderTrendChart(expenses) {
  const months = [];
  const now = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const total = expenses
      .filter((item) => {
        const parsed = new Date(item.date || item.createdAt);
        return !Number.isNaN(parsed.getTime()) &&
          parsed.getFullYear() === date.getFullYear() &&
          parsed.getMonth() === date.getMonth();
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    months.push({
      key,
      label: getMonthLabel(date),
      total,
    });
  }

  const max = Math.max(...months.map((month) => month.total), 1);

  if (!months.some((month) => month.total > 0)) {
    trendChart.innerHTML = '<div class="empty-state">No spending trend yet. Add expenses to see the last 6 months.</div>';
    return;
  }

  trendChart.innerHTML = months
    .map((month) => {
      const width = Math.max(6, (month.total / max) * 100);

      return `
        <div class="trend-row">
          <div class="trend-label">${month.label}</div>
          <div class="trend-track">
            <div class="trend-fill" style="width:${width}%"></div>
          </div>
          <div class="trend-amount">${formatMoney(month.total)}</div>
        </div>
      `;
    })
    .join("");
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectRecurringExpenses(expenses) {
  const groups = new Map();

  for (const expense of expenses) {
    const amount = Number(expense.amount || 0).toFixed(2);
    const category = expense.category || "Other";
    const title = normalizeTitle(expense.title);
    const key = `${title}|${category}|${amount}`;
    const date = new Date(expense.date || expense.createdAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push({
      title: expense.title,
      category,
      amount: Number(expense.amount || 0),
      date,
    });
  }

  const recurring = [];

  for (const items of groups.values()) {
    if (items.length < 3) continue;

    const sorted = items.slice().sort((a, b) => a.date - b.date);
    const gaps = [];

    for (let index = 1; index < sorted.length; index += 1) {
      const diffDays = Math.round((sorted[index].date - sorted[index - 1].date) / (1000 * 60 * 60 * 24));
      gaps.push(diffDays);
    }

    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const nearMonthly = avgGap >= 20 && avgGap <= 40;
    const weekly = avgGap >= 5 && avgGap <= 10;

    if (!nearMonthly && !weekly) continue;

    const last = sorted[sorted.length - 1];
    const nextDue = new Date(last.date);
    nextDue.setDate(nextDue.getDate() + Math.round(avgGap));

    recurring.push({
      title: last.title,
      category: last.category,
      amount: last.amount,
      count: sorted.length,
      avgGap: Math.round(avgGap),
      nextDue,
    });
  }

  recurring.sort((a, b) => b.count - a.count || b.amount - a.amount);
  return recurring.slice(0, 5);
}

function renderRecurringExpenses(expenses) {
  const recurring = detectRecurringExpenses(expenses);

  if (!recurring.length) {
    recurringList.innerHTML = '<div class="empty-state">No recurring patterns detected yet.</div>';
    return;
  }

  recurringList.innerHTML = recurring
    .map((item) => {
      return `
        <article class="recurring-item">
          <strong>${escapeHtml(item.title)}</strong>
          <div class="recurring-meta">
            <span class="recurring-pill">${escapeHtml(item.category)}</span>
            <span>${formatMoney(item.amount)}</span>
            <span>${item.count} repeats</span>
            <span>Every ${item.avgGap} days</span>
          </div>
          <div class="recurring-meta">
            <span>Next likely date: ${formatDate(item.nextDue)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadBudgetGoals() {
  const response = await fetch("/api/user/budget-goals", {
    credentials: "include",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Unable to load budget goals");
  }

  currentBudgetGoals = payload.data || currentBudgetGoals;
  renderBudgetCard(currentExpenses, currentBudgetGoals);
}

async function loadWalletBalance() {
  const response = await fetch("/api/user/wallet-balance", {
    credentials: "include",
  });

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Unable to load wallet balance");
  }

  renderWalletBalance(payload.data?.walletBalance ?? 0);
}

async function loadExpenses() {
  const response = await fetch("/api/expenses/list", {
    credentials: "include",
  });

  if (response.status === 401) {
    window.location.href = "/login";
    return [];
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Unable to load expenses");
  }

  currentExpenses = payload.data || [];
  const categoryEntries = Object.entries(groupByCategory(currentExpenses));
  const topCategoryEntry = categoryEntries.sort((a, b) => b[1] - a[1])[0];

  updateSummary(currentExpenses);
  renderCategoryBars(currentExpenses);
  renderList(currentExpenses);
  renderTrendChart(currentExpenses);
  renderRecurringExpenses(currentExpenses);
  renderCoachSummary({
    total: currentExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    topCategory: topCategoryEntry ? { name: topCategoryEntry[0] } : { name: "Other" },
  });
  renderBudgetCard(currentExpenses, currentBudgetGoals);
  lastSync.textContent = `Synced ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

  return currentExpenses;
}

async function refreshDashboard() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Refreshing...";

  try {
    await loadExpenses();
  } catch (error) {
    setMessage(error.message || "Could not refresh expenses.", "error");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Refresh data";
  }
}

async function getExpenseById(id) {
  const response = await fetch(`/api/expenses/${id}`, {
    credentials: "include",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Could not load expense");
  }

  return payload.data;
}

async function deleteExpenseById(id) {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Could not delete expense");
  }

  return payload;
}

async function updateExpenseById(id, expense) {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(expense),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.message || payload?.errors?.[0]?.msg || "Could not update expense";
    throw new Error(message);
  }

  return payload;
}

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const title = document.getElementById("title").value.trim();
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();
  const date = document.getElementById("date").value;

  if (!title || !amount || !category || !date) {
    setMessage("Please fill in the required expense fields.", "error");
    return;
  }

  saveExpenseBtn.disabled = true;
  saveExpenseBtn.textContent = "Saving...";

  try {
    const response = await fetch("/api/expenses/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title,
        amount: Number(amount),
        category,
        date,
        description,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.message || payload?.errors?.[0]?.msg || "Could not save expense";
      throw new Error(message);
    }

    expenseForm.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    setMessage(payload.message || "Expense saved successfully.", "success");
    await loadExpenses();
  } catch (error) {
    setMessage(error.message || "Could not save expense.", "error");
  } finally {
    saveExpenseBtn.disabled = false;
    saveExpenseBtn.textContent = "Save expense";
  }
});

budgetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBudgetMessage("Saving budget goals...");
  budgetSaveBtn.disabled = true;

  try {
    const payload = {
      monthlyTotal: Number(budgetMonthlyTotalInput.value || 0),
      categories: {
        Food: Number(budgetFoodInput.value || 0),
        Transportation: Number(budgetTransportationInput.value || 0),
        Entertainment: Number(budgetEntertainmentInput.value || 0),
        Utilities: Number(budgetUtilitiesInput.value || 0),
        Other: Number(budgetOtherInput.value || 0),
      },
    };

    const response = await fetch("/api/user/budget-goals", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not save budget goals");
    }

    currentBudgetGoals = data.data || payload;
    renderBudgetCard(currentExpenses, currentBudgetGoals);
    setBudgetMessage("Budget goals saved successfully.", "success");
  } catch (error) {
    setBudgetMessage(error.message || "Could not save budget goals.", "error");
  } finally {
    budgetSaveBtn.disabled = false;
  }
});

walletForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setWalletMessage("Saving wallet balance...");
  walletSaveBtn.disabled = true;

  try {
    const payload = {
      walletBalance: Number(walletBalanceInput.value || 0),
    };

    const response = await fetch("/api/user/wallet-balance", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not save wallet balance");
    }

    renderWalletBalance(data.data?.walletBalance ?? payload.walletBalance);
    setWalletMessage("Wallet balance saved successfully.", "success");
  } catch (error) {
    setWalletMessage(error.message || "Could not save wallet balance.", "error");
  } finally {
    walletSaveBtn.disabled = false;
  }
});

refreshBtn.addEventListener("click", refreshDashboard);

coachFeed.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-prompt]");
  if (!button) return;

  coachPrompt.value = button.dataset.prompt || "";
  coachPrompt.focus();
});

coachForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = coachPrompt.value.trim() || "How can I minimize my expenses?";
  coachSubmitBtn.disabled = true;
  coachSubmitBtn.textContent = "Asking...";
  setCoachStatus("Analyzing your spending with the AI coach...");

  const loadingBubble = appendCoachTurn(question, {}, true);

  try {
    const response = await fetch("/api/ai/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ question }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Could not get AI advice");
    }

    loadingBubble.remove();
    appendCoachTurn(question, payload.data || {});
    setCoachStatus("Coach advice updated.", "success");
  } catch (error) {
    loadingBubble.remove();
    setCoachStatus(error.message || "AI coach failed.", "error");
  } finally {
    coachSubmitBtn.disabled = false;
    coachSubmitBtn.textContent = "Get advice";
  }
});

expenseList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  try {
    if (action === "delete") {
      const confirmDelete = window.confirm("Delete this expense?");
      if (!confirmDelete) return;

      button.disabled = true;
      await deleteExpenseById(id);
      setMessage("Expense deleted successfully.", "success");
      await loadExpenses();
      return;
    }

    if (action === "edit") {
      const expense = await getExpenseById(id);
      const title = window.prompt("Expense title", expense.title);
      if (title === null) return;

      const amount = window.prompt("Expense amount", String(expense.amount));
      if (amount === null) return;

      const category = window.prompt(
        "Category (Food, Transportation, Entertainment, Utilities, Other)",
        expense.category || "Other"
      );
      if (category === null) return;

      const date = window.prompt(
        "Expense date (YYYY-MM-DD)",
        expense.date ? new Date(expense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      );
      if (date === null) return;

      const description = window.prompt("Description", expense.description || "");
      if (description === null) return;

      button.disabled = true;
      await updateExpenseById(id, {
        title: title.trim(),
        amount: Number(amount),
        category: category.trim(),
        date,
        description: description.trim(),
      });

      setMessage("Expense updated successfully.", "success");
      await loadExpenses();
    }
  } catch (error) {
    setMessage(error.message || "Action failed.", "error");
  } finally {
    button.disabled = false;
  }
});

signOutBtn.addEventListener("click", async () => {
  signOutBtn.disabled = true;

  try {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    window.location.href = "/login";
  }
});

async function initializeDashboard() {
  renderCoachIntro();
  try {
    await Promise.all([loadWalletBalance(), loadBudgetGoals(), loadExpenses()]);
  } catch (error) {
    setMessage(error.message || "Failed to load dashboard.", "error");
  }
}

initializeDashboard();
