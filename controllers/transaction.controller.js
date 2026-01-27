const MonthlyLog = require("../models/MonthlyLog");
const Transaction = require("../models/Transaction");
const { createMonthlyLog } = require("./logs.controller");

exports.createTransaction = async (req, res) => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const userId = req.userId;

    let log = await MonthlyLog.findOne({ userId: req.userId, year, month });
    console.log("monthlyLog", log);

    if (log.isClosed) {
      throw new Error("This month is closed. Cannot add transactions.");
    } else {
      const transaction = await Transaction.create({
        userId,
        logId: log._id,
        name: req.body.name,
        amount: req.body.amount,
        type: req.body.type,
        categoryId: req.body.categoryId,
        categoryName: req.body.category,
        source: {
          type: "fixed",
          refId: userId,
        },
        date,
      });
      res.status(201).json(transaction);
    }

    // if (monthlyLog.isClosed) {
    //   throw new Error("This month is closed. Cannot add transactions.");
    // }
    // const transaction = await Transaction.create({
    //   userId,
    //   logId: monthlyLog._id,
    //   name,
    //   amount,
    //   type,
    //   categoryId,
    //   categoryName,
    //   source,
    //   date: txDate,
    // });
    // res.status(201).json(transaction);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Operation failed" });
  }
};
