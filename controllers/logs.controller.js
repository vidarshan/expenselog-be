import mongoose from "mongoose";
import MonthlyLog from "../models/MonthlyLog.js";
import Transaction from "../models/Transaction.js";

export const getActivePeriods = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const periods = await Transaction.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$logId",
        },
      },
      {
        $lookup: {
          from: "monthlylogs",
          localField: "_id",
          foreignField: "_id",
          as: "log",
        },
      },
      { $unwind: "$log" },
      {
        $group: {
          _id: "$log.year",
          months: { $addToSet: "$log.month" },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const result = periods.map((item) => ({
      year: item._id,
      months: item.months.sort((a, b) => a - b),
    }));

    return res.json(result);
  } catch (err) {
    console.error("getActivePeriods error:", err);
    return res.status(500).json({ message: "Failed to fetch active periods" });
  }
};

export const createMonthlyLog = async (req, res) => {
  try {
    const date = new Date();
    const userId = new mongoose.Types.ObjectId(req.userId);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    let log = await MonthlyLog.findOne({ userId, year, month });

    if (!log) {
      log = await MonthlyLog.create({
        userId,
        year,
        month,
      });
    }

    return res.status(201).json(log);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Operation failed" });
  }
};

async function summarizeLog(logId) {
  const [stats] = await Transaction.aggregate([
    { $match: { logId: new mongoose.Types.ObjectId(logId) } },
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
        txCount: { $sum: 1 },
      },
    },
  ]);

  const income = stats?.income ?? 0;
  const expenses = stats?.expenses ?? 0;
  const txCount = stats?.txCount ?? 0;

  return {
    income,
    expenses,
    outcome: income - expenses,
    txCount,
  };
}

export const getMonthlyLogs = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      MonthlyLog.find({ userId })
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MonthlyLog.countDocuments({ userId }),
    ]);

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const s = await summarizeLog(log._id);
        return {
          ...log,
          income: s.income,
          expenses: s.expenses,
          outcome: s.outcome,
          status: log.isClosed ? "Closed" : "Open",
          transactions: s.txCount,
        };
      }),
    );

    return res.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
};

export const getYearlyLogs = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const yearlyLogs = await MonthlyLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$year",
          months: {
            $push: {
              _id: "$_id",
              month: "$month",
              isClosed: "$isClosed",
              createdAt: "$createdAt",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return res.json(yearlyLogs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
