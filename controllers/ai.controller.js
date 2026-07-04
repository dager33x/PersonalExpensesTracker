import "../config/env.js";
import Expense from "../models/expense.model.js";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function summarizeExpenses(expenses) {
  const sortedByDate = [...expenses].sort(
    (a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
  );
  const total = expenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const byCategory = expenses.reduce((acc, item) => {
    const category = item.category || "Other";
    acc[category] = (acc[category] || 0) + toNumber(item.amount);
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || ["Other", 0];
  const largestExpense = [...expenses].sort((a, b) => toNumber(b.amount) - toNumber(a.amount))[0] || null;
  const recurringCandidates = findRecurringCandidates(expenses);
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 8)
    .map((expense) => ({
      title: expense.title,
      amount: toNumber(expense.amount),
      category: expense.category || "Other",
      date: expense.date || expense.createdAt,
      description: expense.description || "",
    }));

  const now = new Date();
  const monthTotal = expenses
    .filter((item) => {
      const parsed = new Date(item.date || item.createdAt);
      return !Number.isNaN(parsed.getTime()) &&
        parsed.getFullYear() === now.getFullYear() &&
        parsed.getMonth() === now.getMonth();
    })
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const activeDays = sortedByDate.length
    ? Math.max(
        1,
        Math.round(
          (new Date(sortedByDate[sortedByDate.length - 1].date || sortedByDate[sortedByDate.length - 1].createdAt) -
            new Date(sortedByDate[0].date || sortedByDate[0].createdAt)) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )
    : 0;

  return {
    total,
    monthTotal,
    totalExpenses: expenses.length,
    byCategory,
    recurringCandidates,
    activeDays,
    averageDailySpend: activeDays ? total / activeDays : 0,
    topCategory: { name: topCategory[0], amount: topCategory[1] },
    largestExpense: largestExpense
      ? {
          title: largestExpense.title,
          amount: toNumber(largestExpense.amount),
          category: largestExpense.category || "Other",
          date: largestExpense.date || largestExpense.createdAt,
        }
      : null,
    recentExpenses,
  };
}

function normalizeExpenseKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findRecurringCandidates(expenses) {
  const groups = new Map();

  for (const expense of expenses) {
    const title = normalizeExpenseKey(expense.title);
    const category = normalizeExpenseKey(expense.category || "Other");
    const amount = toNumber(expense.amount).toFixed(2);
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
      category: expense.category || "Other",
      amount: toNumber(expense.amount),
      date,
    });
  }

  return [...groups.values()]
    .filter((items) => items.length >= 2)
    .map((items) => {
      const sorted = items.slice().sort((a, b) => a.date - b.date);
      const gaps = [];

      for (let index = 1; index < sorted.length; index += 1) {
        const diffDays = Math.max(
          1,
          Math.round((sorted[index].date - sorted[index - 1].date) / (1000 * 60 * 60 * 24))
        );
        gaps.push(diffDays);
      }

      const averageGap = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;

      return {
        title: sorted[0].title,
        category: sorted[0].category,
        amount: sorted[0].amount,
        count: sorted.length,
        averageGap: Math.round(averageGap),
        total: sorted.reduce((sum, item) => sum + item.amount, 0),
      };
    })
    .sort((a, b) => b.count - a.count || b.total - a.total)
    .slice(0, 3);
}

function buildCoachTone(question) {
  const q = String(question || "").toLowerCase();

  if (!q) return "review";
  if (q.includes("overspend") || q.includes("overspending") || q.includes("too much")) return "overspend";
  if (q.includes("save") || q.includes("cut") || q.includes("reduce")) return "save";
  if (q.includes("biggest") || q.includes("highest") || q.includes("top")) return "top";
  if (q.includes("recurr") || q.includes("subscription") || q.includes("repeat")) return "recurring";
  if (q.includes("how much") || q.includes("spent") || q.includes("spending")) return "spending";
  return "review";
}

function buildExpenseCoachReply(summary, question, tone, estimatedSavings, mode = "friendly") {
  const category = summary.topCategory?.name || "Other";
  const categoryShare = summary.total ? Math.round((summary.topCategory.amount / summary.total) * 100) : 0;
  const intro = question
    ? `On "${question.trim()}", the clearest pressure point is ${category.toLowerCase()}.`
    : `Your spending is being pulled most by ${category.toLowerCase()}.`;
  const friendlyLead = `If I were coaching this month with you, I would start there first.`;
  const strictLead = `That is the line item to control immediately if you want a faster result.`;

  const secondSentenceMap = {
    overspend: `It takes up about ${categoryShare}% of your total spending, so even a small trim can noticeably lower your month.`,
    save: `A realistic first target is to free up about ${formatMoney(estimatedSavings)} this month without cutting essentials.`,
    top: `It currently leads your expenses at ${formatMoney(summary.topCategory.amount)}, so it is the clearest lever to pull.`,
    recurring: summary.recurringCandidates.length
      ? `You also have repeat items, especially ${summary.recurringCandidates[0].title}, which is worth reviewing first.`
      : `I do not see a strong repeating pattern yet, so the best wins are in the top category and small daily purchases.`,
    spending: `You have spent ${formatMoney(summary.monthTotal)} this month across ${summary.totalExpenses} entries, so small leaks matter.`,
    review: `It currently accounts for about ${categoryShare}% of your total spending, which is enough to shape the whole budget.`,
  };

  const thirdSentenceMap = {
    overspend: `Cutting one repeated purchase and setting a weekly limit is the fastest way to get control.`,
    save: `The best approach is one or two specific changes you can keep doing all month.`,
    top: `If you reduce even a small part of it, the effect will show up quickly in your monthly total.`,
    recurring: `That usually means a subscription, bill, or repeating habit rather than a one-time buy.`,
    spending: `Your biggest gains will probably come from repeat costs, not random large purchases.`,
    review: `Focus on repeat purchases first, because they compound faster than one-off expenses.`,
  };

  const modeLead = mode === "strict" ? strictLead : friendlyLead;
  return `${intro} ${modeLead} ${secondSentenceMap[tone]} ${thirdSentenceMap[tone]}`;
}

function buildCoachSections(summary, question, tone, mode, estimatedSavings) {
  const category = summary.topCategory?.name || "Other";
  const categoryShare = summary.total ? Math.round((summary.topCategory.amount / summary.total) * 100) : 0;
  const recurring = summary.recurringCandidates[0];
  const whatISee = tone === "recurring" && recurring
    ? `${recurring.title} shows up ${recurring.count} times and looks like a repeat cost worth checking.`
    : `Your ${category.toLowerCase()} spend is leading the month at about ${categoryShare}% of total spending.`;

  const whyItMatters = mode === "strict"
    ? `If you do not cap it, this category will keep pushing your month higher than you expect.`
    : `That is the kind of pattern that quietly eats into savings if nobody watches it.`;

  const nextMove = mode === "strict"
    ? `Set a weekly limit for ${category.toLowerCase()} at about ${formatMoney(summary.topCategory.amount / 4)} and delay one non-essential buy for 7 days.`
    : recurring
      ? `Check ${recurring.title}, then cut or cap one repeat purchase before the next pay cycle.`
      : `Pick one expense to trim now and keep the saved amount aside for the rest of the month.`;

  const coachNote = question
    ? `You asked: ${question.trim()}`
    : `I looked at your current spending pattern and picked the clearest pressure point.`;

  return [
    { label: "What I see", text: whatISee },
    { label: "Why it matters", text: whyItMatters },
    { label: "Next move", text: nextMove },
    { label: "Coach note", text: `${coachNote} Estimated savings: ${formatMoney(estimatedSavings)}.` },
  ];
}

function buildPrompt(summary, question, mode = "friendly") {
  const coachTone = mode === "strict" ? "strict, direct, and no-nonsense" : "warm, conversational, and encouraging";
  const lines = [
    `You are a sharp, friendly expense coach for a personal finance dashboard.`,
    `Use only the provided expense data. Do not invent categories, spending, or life context.`,
    `Be practical, specific, and encouraging. Focus on ways to reduce spending and improve budgeting.`,
    `Tone: ${coachTone}.`,
    `Keep the reply concise and useful. Avoid generic finance advice.`,
    `Return only valid JSON with this exact shape:`,
    `{`,
    `  "headline": string,`,
    `  "reply": string,`,
    `  "insights": string[],`,
    `  "actions": string[],`,
    `  "estimated_savings": number`,
    `}`,
    `Do not wrap the JSON in markdown fences or add any extra commentary.`,
    `If the user asks a question, answer it directly using the expense data.`,
    `If there is a clear risk area, call it out calmly and suggest one small next step.`,
    ``,
    `Expense summary:`,
    `- Total spent: ${formatMoney(summary.total)}`,
    `- This month: ${formatMoney(summary.monthTotal)}`,
    `- Entry count: ${summary.totalExpenses}`,
    `- Top category: ${summary.topCategory.name} (${formatMoney(summary.topCategory.amount)})`,
  ];

  if (summary.largestExpense) {
    lines.push(
      `- Largest expense: ${summary.largestExpense.title} (${formatMoney(summary.largestExpense.amount)} in ${summary.largestExpense.category})`
    );
  }

  lines.push(`- Recent expenses:`);
  for (const expense of summary.recentExpenses) {
    lines.push(
      `  * ${expense.title} | ${expense.category} | ${formatMoney(expense.amount)} | ${new Date(expense.date).toLocaleDateString("en-US")}`
    );
  }

  if (summary.recurringCandidates?.length) {
    lines.push(`- Repeated patterns:`);
    for (const item of summary.recurringCandidates) {
      lines.push(`  * ${item.title} | ${item.category} | ${formatMoney(item.amount)} | repeats ${item.count} times`);
    }
  }

  if (question) {
    lines.push(``, `User question: ${question}`);
  } else {
    lines.push(``, `User question: Suggest how I can minimize my expenses this month.`);
  }

  return lines.join("\n");
}

function extractTextFromResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const preferredPaths = [
    ["output_text"],
    ["text"],
    ["candidates", 0, "content", "parts", 0, "text"],
    ["candidates", 0, "content", "parts", 0],
    ["steps", 0, "modelOutput", "content", 0, "text", "text"],
    ["steps", 0, "modelOutput", "content", 0, "text"],
    ["steps", 0, "modelOutput", "content", 0],
  ];

  for (const path of preferredPaths) {
    let current = payload;
    let found = true;

    for (const key of path) {
      if (current == null) {
        found = false;
        break;
      }

      current = current[key];
    }

    if (!found || current == null) {
      continue;
    }

    if (typeof current === "string" && current.trim()) {
      return current.trim();
    }

    if (typeof current === "object") {
      if (typeof current.text === "string" && current.text.trim()) {
        return current.text.trim();
      }

      if (typeof current.output_text === "string" && current.output_text.trim()) {
        return current.output_text.trim();
      }
    }
  }

  const stack = [payload];
  const visited = new Set();

  while (stack.length) {
    const current = stack.pop();

    if (!current || typeof current !== "object" || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (typeof current.output_text === "string" && current.output_text.trim()) {
      return current.output_text.trim();
    }

    if (typeof current.text === "string" && current.text.trim()) {
      return current.text.trim();
    }

    if (Array.isArray(current)) {
      for (let index = current.length - 1; index >= 0; index -= 1) {
        stack.push(current[index]);
      }
      continue;
    }

    for (const value of Object.values(current)) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }

  return "";
}

function cleanJsonText(value) {
  return String(value)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function getCoachResponseSchema() {
  return {
    type: "object",
    properties: {
      headline: { type: "string" },
      reply: { type: "string" },
      insights: {
        type: "array",
        items: { type: "string" },
      },
      actions: {
        type: "array",
        items: { type: "string" },
      },
      estimated_savings: { type: "number" },
    },
    required: ["headline", "reply", "insights", "actions", "estimated_savings"],
  };
}

function buildFallbackAdvice(summary, question, mode = "friendly") {
  return buildFallbackAdviceWithMode(summary, question, mode);
}

function buildFallbackAdviceWithMode(summary, question, mode = "friendly") {
  const spendingCategory = summary.topCategory?.name || "Other";
  const monthlyShare = summary.total ? Math.round((summary.topCategory.amount / summary.total) * 100) : 0;
  const recurringWaste = summary.recurringCandidates.reduce((sum, item) => sum + Math.max(0, item.total - item.amount), 0);
  const categoryOpportunity = Math.max(0, summary.topCategory.amount * 0.18);
  const monthlyOpportunity = Math.max(0, summary.monthTotal * 0.1);
  const estimatedSavings = Math.round(Math.max(recurringWaste, categoryOpportunity, monthlyOpportunity));
  const tone = buildCoachTone(question);
  const topRecurring = summary.recurringCandidates[0];
  const hasRecurring = Boolean(topRecurring);
  const replySections = buildCoachSections(summary, question, tone, mode, estimatedSavings);

  return {
    headline:
      mode === "strict"
        ? "Strict expense coach"
        : tone === "overspend"
          ? "Overspending check"
          : tone === "recurring"
            ? "Recurring-cost coach"
            : tone === "save"
              ? "Savings plan"
              : "Expense coach",
    reply: buildExpenseCoachReply(summary, question, tone, estimatedSavings, mode),
    replySections,
    insights: [
      `${spendingCategory} is your biggest category at about ${monthlyShare}% of total spending.`,
      `Your current month totals ${formatMoney(summary.monthTotal)} across ${summary.totalExpenses} entries.`,
      hasRecurring
        ? `${topRecurring.title} appears ${topRecurring.count} times, which makes it a strong recurring-cost candidate.`
        : `No strong repeat pattern stands out yet, so the best gains are likely from your top category and small daily buys.`,
      summary.averageDailySpend
        ? `Your average daily spend is about ${formatMoney(summary.averageDailySpend)}, which shows whether the month is heating up quickly.`
        : "Add a few more transactions and the coach will start spotting patterns automatically.",
    ],
    actions: [
      `Set a weekly cap for ${spendingCategory.toLowerCase()} at about ${formatMoney(summary.topCategory.amount / 4)}.`,
      hasRecurring
        ? `Review ${topRecurring.title} and decide whether it should stay, pause, or be capped.`
        : "Audit subscriptions and repeat buys once this week.",
      "Delay one non-essential purchase for 7 days before paying for it.",
      "Pick one expense to cut now and track the savings for the rest of the month.",
    ],
    estimated_savings: estimatedSavings,
    source: "fallback",
  };
}

function isQuotaOrBillingError(message = "") {
  const text = String(message).toLowerCase();
  return (
    text.includes("quota") ||
    text.includes("billing") ||
    text.includes("insufficient_quota") ||
    text.includes("usage limit") ||
    text.includes("rate limit") ||
    text.includes("resource exhausted") ||
    text.includes("limit exceeded")
  );
}

export const coachExpenseAdvice = async (req, res, next) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: "Gemini is not configured yet. Add GEMINI_API_KEY or GOOGLE_API_KEY to enable the coach.",
      });
    }

    const { question = "", mode = "friendly" } = req.body || {};
    const normalizedMode = mode === "strict" ? "strict" : "friendly";
    const expenses = await Expense.find({ userId: req.user._id });
    const summary = summarizeExpenses(expenses);

    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
          input: buildPrompt(summary, question.trim(), normalizedMode),
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: getCoachResponseSchema(),
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload?.error?.message || payload?.message || "Gemini request failed.";
        if (isQuotaOrBillingError(message)) {
          return res.status(200).json({
            success: true,
            data: {
              ...buildFallbackAdvice(summary, question, normalizedMode),
              summary,
              warning: "Gemini quota or billing limit reached. Showing local coach advice instead.",
            },
          });
        }

        return res.status(502).json({
          success: false,
          message,
        });
      }

      const raw = payload?.output_text || extractTextFromResponse(payload);
      const cleaned = cleanJsonText(raw);

      try {
        const advice = JSON.parse(cleaned);
        return res.status(200).json({
          success: true,
          data: {
            ...advice,
            summary,
          },
        });
      } catch {
        return res.status(200).json({
          success: true,
          data: {
            ...buildFallbackAdvice(summary, question, normalizedMode),
            summary,
            warning: "The Gemini response could not be parsed. Showing local coach advice instead.",
          },
        });
      }
    } catch (geminiError) {
      const message = geminiError?.message || "Gemini request failed.";
      if (isQuotaOrBillingError(message)) {
        return res.status(200).json({
          success: true,
          data: {
            ...buildFallbackAdvice(summary, question, normalizedMode),
            summary,
            warning: "Gemini quota or billing limit reached. Showing local coach advice instead.",
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...buildFallbackAdvice(summary, question, normalizedMode),
          summary,
          warning: "Gemini is unavailable right now. Showing local coach advice instead.",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
