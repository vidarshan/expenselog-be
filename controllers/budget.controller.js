import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import MonthlyLog from "../models/MonthlyLog.js";

export const getBudgetOverview = async (req, res) => {
  try {
    const userId = req.userId;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return res.status(400).json({ message: "Year and month required" });
    }

    const budgets = await Budget.find({
      userId,
      year,
      month,
      isDeleted: false,
    })
      .populate("categoryId", "name")
      .lean();

    const monthlyLog = await MonthlyLog.findOne({
      userId,
      year,
      month,
    }).lean();

    let spentByCategory = [];

    if (monthlyLog) {
      spentByCategory = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            logId: monthlyLog._id,
            type: "expense",
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$categoryId",
            spent: { $sum: "$amount" },
          },
        },
      ]);
    }

    const spentMap = new Map(
      spentByCategory.map((x) => [String(x._id), x.spent]),
    );

    const items = budgets.map((b) => {
      const categoryObjectId = b.categoryId?._id;
      const spent = categoryObjectId
        ? spentMap.get(String(categoryObjectId)) || 0
        : 0;
      const remaining = b.limit - spent;
      const pctUsed = b.limit === 0 ? 0 : spent / b.limit;

      let status = "ok";
      if (spent > b.limit) status = "over";
      else if (pctUsed >= 0.85) status = "warning";

      return {
        categoryId: categoryObjectId,
        categoryName: b.categoryId?.name || "Unknown",
        limit: b.limit,
        spent,
        remaining,
        pctUsed,
        status,
      };
    });

    const budgetedIds = new Set(
      budgets
        .filter((b) => b.categoryId?._id)
        .map((b) => String(b.categoryId._id)),
    );

    const unbudgetedBase = spentByCategory.filter(
      (x) => !budgetedIds.has(String(x._id)),
    );

    const unbudgetedCategoryIds = unbudgetedBase.map((x) => x._id);

    const unbudgetedCategories = await Category.find({
      _id: { $in: unbudgetedCategoryIds },
      userId,
      isDeleted: false,
    }).lean();

    const unbudgetedCategoryMap = new Map(
      unbudgetedCategories.map((c) => [String(c._id), c.name]),
    );

    const unbudgeted = unbudgetedBase.map((x) => ({
      categoryId: x._id,
      categoryName: unbudgetedCategoryMap.get(String(x._id)) || "Unknown",
      spent: x.spent,
    }));

    const totalLimit = items.reduce((sum, item) => sum + item.limit, 0);
    const totalSpentBudgeted = items.reduce((sum, item) => sum + item.spent, 0);
    const totalSpentAll = spentByCategory.reduce(
      (sum, item) => sum + item.spent,
      0,
    );

    return res.json({
      period: { year, month },
      items,
      unbudgeted,
      summary: {
        totalLimit,
        totalSpentBudgeted,
        totalSpentAll,
        overBudgetCount: items.filter((item) => item.status === "over").length,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createOrEditBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const { year, month, categoryId, limit } = req.body;

    if (!year || !month || !categoryId || limit == null) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId, year, month, categoryId },
      {
        $set: {
          limit,
          isDeleted: false,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return res.status(201).json(budget);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const userId = req.userId;

    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        userId,
      },
      { isDeleted: true },
      { new: true },
    );

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
