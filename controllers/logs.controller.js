const MonthlyLog = require("../models/MonthlyLog");
const mongoose = require("mongoose");

exports.createMonthlyLog = async (req, res) => {
  try {
    const date = new Date();
    const userId = req.userId;
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

    res.status(201).json(log);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Operation failed" });
  }
};

exports.getMonthlyLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      MonthlyLog.find({ userId: req.userId })
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit),
      MonthlyLog.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
};

exports.getYearlyLogs = async (req, res) => {
  try {
    const yearlyLogs = await MonthlyLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
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

    res.json(yearlyLogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
