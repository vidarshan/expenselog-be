import mongoose from "mongoose";
import MonthlyLog from "../models/MonthlyLog.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

function parseYearMonth(req) {
  const year = Number(req.query.year);
  const month = Number(req.query.month);

  if (!Number.isInteger(year) || year < 2000 || year > 3000) {
    return { error: "Invalid year" };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Invalid month (1-12)" };
  }
  return { year, month };
}

function prevYearMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

async function ensureMonthlyLog(userId, year, month) {
  let log = await MonthlyLog.findOne({ userId, year, month });
  if (!log) {
    log = await MonthlyLog.create({ userId, year, month });
  }
  return log;
}

async function aggregateSummary(logId) {
  const rows = await Transaction.aggregate([
    { $match: { logId } },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  let income = 0;
  let expenses = 0;
  let txCount = 0;

  for (const r of rows) {
    txCount += r.count;
    if (r._id === "income") income = r.total;
    if (r._id === "expense") expenses = r.total;
  }

  const net = income - expenses;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

  return { income, expenses, net, savingsRate, txCount };
}

async function buildBudgetProgress(userId, year, month, logId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [budgets, spentRows] = await Promise.all([
    Budget.find({ userId, year, month })
      .select("categoryId categoryName limit")
      .lean(),

    Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          logId,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$categoryId",
          spent: { $sum: "$amount" },
          categoryName: {
            $first: { $ifNull: ["$categoryName", "Uncategorized"] },
          },
        },
      },
    ]),
  ]);

  const spentMap = new Map();
  for (const row of spentRows) {
    const key = row._id ? String(row._id) : "uncategorized";
    spentMap.set(key, {
      spent: row.spent || 0,
      categoryName: row.categoryName || "Uncategorized",
    });
  }

  const items = budgets.map((budget) => {
    const key = budget.categoryId ? String(budget.categoryId) : "uncategorized";
    const spentInfo = spentMap.get(key);

    const limit = Number(budget.limit) || 0;
    const spent = Number(spentInfo?.spent || 0);
    const remaining = limit - spent;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;

    let status = "ok";
    if (limit <= 0) {
      status = spent > 0 ? "over" : "ok";
    } else if (spent > limit) {
      status = "over";
    } else if (spent / limit >= 0.85) {
      status = "warning";
    }

    return {
      categoryId: budget.categoryId || null,
      categoryName:
        budget.categoryName || spentInfo?.categoryName || "Uncategorized",
      limit,
      spent,
      remaining,
      percent: Number(percent.toFixed(1)),
      status,
    };
  });

  const totalLimit = items.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = items.reduce((sum, item) => sum + item.spent, 0);
  const overBudgetCount = items.filter((item) => item.status === "over").length;
  const warningCount = items.filter((item) => item.status === "warning").length;

  return {
    items,
    summary: {
      totalLimit,
      totalSpent,
      remaining: totalLimit - totalSpent,
      overBudgetCount,
      warningCount,
    },
  };
}

async function aggregateRecentTransactions(logId) {
  return Transaction.find({ logId })
    .sort({ date: -1, createdAt: -1 })
    .limit(6)
    .select("name amount type date categoryName categoryColor")
    .lean();
}

async function aggregateCategoryBreakdown(userId, year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  return Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: "expense",
        isDeleted: { $ne: true },
        date: { $gte: start, $lte: end },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amount" },
        categoryName: {
          $first: {
            $ifNull: ["$category.name", "$categoryName", "Uncategorized"],
          },
        },
        color: {
          $first: {
            $ifNull: ["$category.color", "gray"],
          },
        },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        categoryName: 1,
        color: 1,
        total: 1,
      },
    },
  ]);
}

async function aggregateMonthCategoryTotals(userId, start, end) {
  return Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: "expense",
        isDeleted: { $ne: true },
        date: { $gte: start, $lte: end },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          name: {
            $ifNull: ["$category.name", "$categoryName", "Uncategorized"],
          },
          color: {
            $ifNull: ["$category.color", "gray"],
          },
        },
        total: { $sum: "$amount" },
      },
    },
  ]);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthLabel(year, month) {
  return `${MONTHS[month - 1]} ${year}`;
}

function monthRange(year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function buildCategoryMonthlyComparison(userId, year, month) {
  const { start, end } = monthRange(year, month);
  const prev = prevYearMonth(year, month);
  const { start: prevStart, end: prevEnd } = monthRange(prev.year, prev.month);

  const [curr, prevRows] = await Promise.all([
    aggregateMonthCategoryTotals(userId, start, end),
    aggregateMonthCategoryTotals(userId, prevStart, prevEnd),
  ]);

  const currTotals = {};
  for (const r of curr) {
    currTotals[r._id.name] = {
      total: r.total,
      color: r._id.color,
    };
  }

  const prevTotals = {};
  for (const r of prevRows) {
    prevTotals[r._id.name] = {
      total: r.total,
      color: r._id.color,
    };
  }

  const labelA = monthLabel(prev.year, prev.month);
  const labelB = monthLabel(year, month);

  const categories = Array.from(
    new Set([...Object.keys(currTotals), ...Object.keys(prevTotals)]),
  );

  return categories.map((cat) => ({
    category: cat,
    color: currTotals[cat]?.color || prevTotals[cat]?.color || "gray",
    [labelA]: prevTotals[cat]?.total ?? 0,
    [labelB]: currTotals[cat]?.total ?? 0,
  }));
}
async function buildCategoryCompareAnyTwoMonths(
  userId,
  yearA,
  monthA,
  yearB,
  monthB,
) {
  const { start: startA, end: endA } = monthRange(yearA, monthA);
  const { start: startB, end: endB } = monthRange(yearB, monthB);

  const [aRows, bRows] = await Promise.all([
    aggregateMonthCategoryTotals(userId, startA, endA),
    aggregateMonthCategoryTotals(userId, startB, endB),
  ]);

  const labelA = monthLabel(yearA, monthA);
  const labelB = monthLabel(yearB, monthB);

  const aTotals = {};
  for (const r of aRows) {
    aTotals[r._id.name] = {
      total: r.total,
      color: r._id.color,
    };
  }

  const bTotals = {};
  for (const r of bRows) {
    bTotals[r._id.name] = {
      total: r.total,
      color: r._id.color,
    };
  }

  const categories = Array.from(
    new Set([...Object.keys(aTotals), ...Object.keys(bTotals)]),
  );

  return {
    labels: { a: labelA, b: labelB },
    data: categories.map((cat) => ({
      category: cat,
      color: aTotals[cat]?.color || bTotals[cat]?.color || "gray",
      [labelA]: aTotals[cat]?.total ?? 0,
      [labelB]: bTotals[cat]?.total ?? 0,
    })),
  };
}

export const getCategoryComparison = async (req, res) => {
  try {
    const userId = req.userId;

    const yearA = Number(req.query.yearA);
    const monthA = Number(req.query.monthA);
    const yearB = Number(req.query.yearB);
    const monthB = Number(req.query.monthB);

    if (!yearA || !monthA || !yearB || !monthB) {
      return res.status(400).json({
        message: "yearA/monthA/yearB/monthB are required",
      });
    }

    const result = await buildCategoryCompareAnyTwoMonths(
      userId,
      yearA,
      monthA,
      yearB,
      monthB,
    );

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to compare months" });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const { year, month, error } = parseYearMonth(req);
    if (error) return res.status(400).json({ message: error });

    const userId = req.userId;

    const log = await ensureMonthlyLog(userId, year, month);

    const prev = prevYearMonth(year, month);
    const prevLog = await MonthlyLog.findOne({
      userId,
      year: prev.year,
      month: prev.month,
    }).lean();

    const [summary, categoryBreakdown, recentTransactions, monthlyComparison] =
      await Promise.all([
        aggregateSummary(log._id),
        aggregateCategoryBreakdown(userId, year, month),
        aggregateRecentTransactions(log._id),
        buildCategoryMonthlyComparison(userId, year, month),
      ]);

    let prevSummary = {
      income: 0,
      expenses: 0,
      net: 0,
      savingsRate: 0,
      txCount: 0,
    };
    if (prevLog) prevSummary = await aggregateSummary(prevLog._id);

    const comparison = {
      lastMonth: { year: prev.year, month: prev.month },
      incomeDiff: summary.income - prevSummary.income,
      expensesDiff: summary.expenses - prevSummary.expenses,
      netDiff: summary.net - prevSummary.net,
    };

    const budgets = await buildBudgetProgress(userId, year, month, log._id);

    return res.json({
      meta: { year, month, logId: log._id.toString() },
      summary,
      categoryBreakdown,
      recentTransactions,
      monthlyComparison,
      comparison,
      budgets,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
};
