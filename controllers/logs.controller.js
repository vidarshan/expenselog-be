const MonthlyLog = require("../models/MonthlyLog");

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
    const monthlyLogs = await MonthlyLog.find({
      userId: req.userId,
    });

    res.json(monthlyLogs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
};
