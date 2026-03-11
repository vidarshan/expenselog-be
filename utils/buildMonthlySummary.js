import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";

function getMonthRange(month) {
  const [year, mon] = month.split("-").map(Number);

  const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, mon, 1, 0, 0, 0, 0));

  const prevStart = new Date(Date.UTC(year, mon - 2, 1, 0, 0, 0, 0));
  const prevEnd = start;

  return { start, end, prevStart, prevEnd };
}

function pctChange(current, previous) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function round2(n) {
  return Number((n || 0).toFixed(2));
}

export async function buildMonthlySummary(userId, month) {
  const { start, end, prevStart, prevEnd } = getMonthRange(month);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const currentTx = await Transaction.find({
    userId: userObjectId,
    date: { $gte: start, $lt: end },
    isDeleted: { $ne: true },
  })
    .populate("categoryId", "name kind")
    .lean();

  const prevTx = await Transaction.find({
    userId: userObjectId,
    date: { $gte: prevStart, $lt: prevEnd },
    isDeleted: { $ne: true },
  })
    .populate("categoryId", "name kind")
    .lean();

  const currentIncomeTx = currentTx.filter((t) => t.type === "income");
  const currentExpenseTx = currentTx.filter((t) => t.type === "expense");

  const prevIncomeTx = prevTx.filter((t) => t.type === "income");
  const prevExpenseTx = prevTx.filter((t) => t.type === "expense");

  const totalIncome = round2(
    currentIncomeTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );

  const totalExpenses = round2(
    currentExpenseTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );

  const prevIncome = round2(
    prevIncomeTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );

  const prevExpenses = round2(
    prevExpenseTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );

  const savings = round2(totalIncome - totalExpenses);
  const savingsRate =
    totalIncome > 0 ? round2((savings / totalIncome) * 100) : 0;

  // Category totals
  const categoryMap = new Map();

  for (const tx of currentExpenseTx) {
    const categoryName = tx.categoryId?.name || "Uncategorized";
    const amount = Number(tx.amount) || 0;

    categoryMap.set(
      categoryName,
      (categoryMap.get(categoryName) || 0) + amount,
    );
  }

  const topCategories = [...categoryMap.entries()]
    .map(([name, amount]) => ({ name, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Month-over-month change
  const monthOverMonthChange = {
    expenses: pctChange(totalExpenses, prevExpenses),
    income: pctChange(totalIncome, prevIncome),
  };

  // Essential vs discretionary
  let essentialExpenses = 0;
  let discretionaryExpenses = 0;

  for (const tx of currentExpenseTx) {
    const amount = Number(tx.amount) || 0;
    const kind = tx.categoryId?.kind;

    if (kind === "essential") essentialExpenses += amount;
    else discretionaryExpenses += amount;
  }

  const essentialRatio =
    totalExpenses > 0 ? round2(essentialExpenses / totalExpenses) : 0;

  const discretionaryRatio =
    totalExpenses > 0 ? round2(discretionaryExpenses / totalExpenses) : 0;

  // Category deltas vs previous month
  const prevCategoryMap = new Map();

  for (const tx of prevExpenseTx) {
    const categoryName = tx.categoryId?.name || "Uncategorized";
    const amount = Number(tx.amount) || 0;

    prevCategoryMap.set(
      categoryName,
      (prevCategoryMap.get(categoryName) || 0) + amount,
    );
  }

  const allCategoryNames = new Set([
    ...categoryMap.keys(),
    ...prevCategoryMap.keys(),
  ]);

  const categoryDeltas = [...allCategoryNames]
    .map((name) => {
      const current = categoryMap.get(name) || 0;
      const previous = prevCategoryMap.get(name) || 0;
      const deltaAmount = current - previous;

      return {
        name,
        deltaAmount: round2(deltaAmount),
        deltaPct: pctChange(current, previous),
      };
    })
    .sort((a, b) => Math.abs(b.deltaAmount) - Math.abs(a.deltaAmount))
    .slice(0, 5);

  // Repeat merchants
  const merchantMap = new Map();

  for (const tx of currentExpenseTx) {
    const merchant = (tx.name || "Unknown").trim();
    const amount = Number(tx.amount) || 0;

    if (!merchantMap.has(merchant)) {
      merchantMap.set(merchant, { name: merchant, count: 0, total: 0 });
    }

    const entry = merchantMap.get(merchant);
    entry.count += 1;
    entry.total += amount;
  }

  const repeatMerchants = [...merchantMap.values()]
    .filter((m) => m.count >= 2)
    .map((m) => ({
      name: m.name,
      count: m.count,
      total: round2(m.total),
    }))
    .sort((a, b) => b.count - a.count || b.total - a.total)
    .slice(0, 5);

  // Simple anomalies
  // Rule: any expense > 2x average expense
  const avgExpense =
    currentExpenseTx.length > 0 ? totalExpenses / currentExpenseTx.length : 0;

  const anomalies = currentExpenseTx
    .filter(
      (tx) => Number(tx.amount) > avgExpense * 2 && Number(tx.amount) >= 50,
    )
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map((tx) => ({
      description: `Higher-than-usual expense`,
      amount: round2(Number(tx.amount) || 0),
      category: tx.categoryId?.name || "Uncategorized",
    }));

  // last10Transactions
  const last10Transactions = [...currentTx]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .map((tx) => ({
      name: tx.name,
      amount: round2(Number(tx.amount) || 0),
      type: tx.type,
      date: tx.date,
      category: tx.categoryId?.name || "Uncategorized",
    }));

  return {
    month,
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    topCategories,
    monthOverMonthChange,
    essentialRatio,
    discretionaryRatio,
    categoryDeltas,
    repeatMerchants,
    anomalies,
    last10Transactions,
  };
}
