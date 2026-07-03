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
  const total = expenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const byCategory = expenses.reduce((acc, item) => {
    const category = item.category || "Other";
    acc[category] = (acc[category] || 0) + toNumber(item.amount);
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || ["Other", 0];
  const largestExpense = [...expenses].sort((a, b) => toNumber(b.amount) - toNumber(a.amount))[0] || null;
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

  return {
    total,
    monthTotal,
    totalExpenses: expenses.length,
    byCategory,
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

function buildPrompt(summary, question) {
  const lines = [
    `You are a friendly expense coach for a personal finance dashboard.`,
    `Use only the provided expense data. Do not invent categories, spending, or life context.`,
    `Be practical, specific, and encouraging. Focus on ways to reduce spending and improve budgeting.`,
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

function buildFallbackAdvice(summary, question) {
  const spendingCategory = summary.topCategory?.name || "Other";
  const monthlyShare = summary.total ? Math.round((summary.topCategory.amount / summary.total) * 100) : 0;
  const estimatedSavings = Math.max(0, Math.round(summary.monthTotal * 0.12));
  const asksAbout = question
    ? `For your question "${question.trim()}",`
    : "Based on your current spending,";

  return {
    headline: "Practical savings coach",
    reply: `${asksAbout} the fastest wins are to trim your ${spendingCategory.toLowerCase()} spend, watch small repeated purchases, and set one weekly spending cap.`,
    insights: [
      `${spendingCategory} is your largest category at about ${monthlyShare}% of total spending.`,
      `Your current monthly spend is ${formatMoney(summary.monthTotal)}, so even a small reduction can make a difference.`,
      `The biggest single expense is a good candidate to review for recurring patterns or one-off purchases.`,
    ],
    actions: [
      `Set a weekly cap for ${spendingCategory.toLowerCase()} purchases.`,
      "Remove or delay any low-priority purchases for 7 days.",
      "Review the top 3 expenses and cut one repeated cost.",
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

    const { question = "" } = req.body || {};
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
          input: buildPrompt(summary, question.trim()),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload?.error?.message || payload?.message || "Gemini request failed.";
        if (isQuotaOrBillingError(message)) {
          return res.status(200).json({
            success: true,
            data: {
              ...buildFallbackAdvice(summary, question),
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

      const raw = extractTextFromResponse(payload);
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
            ...buildFallbackAdvice(summary, question),
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
            ...buildFallbackAdvice(summary, question),
            summary,
            warning: "Gemini quota or billing limit reached. Showing local coach advice instead.",
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...buildFallbackAdvice(summary, question),
          summary,
          warning: "Gemini is unavailable right now. Showing local coach advice instead.",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
