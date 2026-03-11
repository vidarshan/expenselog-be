import mongoose from "mongoose";
import MonthlyLog from "../models/MonthlyLog.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import Category from "../models/Category.js";

function ymdToUTCNoon(value) {
  if (!value) return null;

  const datePart = String(value).slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);

  if (!y || !m || !d) return null;

  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}
function computeDelta(accountType, txType, amount) {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) throw new Error("Amount must be > 0");

  // cash/bank behave normally: income increases, expense decreases
  if (accountType === "cash" || accountType === "bank") {
    return txType === "income" ? +amt : -amt;
  }

  // credit: currentBalance = amount owed (simple model)
  // expense increases debt, income (payment) reduces debt
  if (accountType === "credit") {
    return txType === "expense" ? +amt : -amt;
  }

  throw new Error("Invalid account type");
}

async function getOrCreateMonthlyLog({ userId, date }) {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  let log = await MonthlyLog.findOne({ userId, year, month });
  if (!log) {
    log = await MonthlyLog.create({ userId, year, month });
  }
  return log;
}

export const deleteTransaction = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const txId = new mongoose.Types.ObjectId(req.params.id);

    const tx = await Transaction.findOne({
      _id: txId,
      userId,
      isDeleted: { $ne: true },
    });

    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const account = await Account.findOne({
      _id: tx.accountId,
      userId,
      isDeleted: false,
    });

    if (!account) return res.status(404).json({ message: "Account not found" });

    const delta = computeDelta(account.type, tx.type, tx.amount);

    tx.isDeleted = true;
    await tx.save();

    await Account.updateOne(
      { _id: account._id },
      { $inc: { currentBalance: -delta } },
    );

    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
export const createTransaction = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { accountId, type, amount, categoryId, date, time, source, name } =
      req.body;

    if (!accountId) throw new Error("accountId is required");

    const account = await Account.findOne({
      _id: accountId,
      userId,
      isDeleted: false,
    });
    if (!account) return res.status(404).json({ message: "Account not found" });

    const delta = computeDelta(account.type, type, amount);

    const log = await getOrCreateMonthlyLog({ userId, date, session: null });
    let categoryName = "";
    if (type === "expense") {
      const cat = await Category.findOne({
        _id: new mongoose.Types.ObjectId(categoryId),
        userId,
        isDeleted: false,
      }).lean();

      if (!cat) return res.status(404).json({ message: "Category not found" });

      categoryName = cat.name;
      categoryColor = cat.color;
    }
    const tx = await Transaction.create({
      userId,
      logId: log._id,
      accountId,
      type,
      amount: Number(amount),
      name: name ?? "Transaction",
      categoryId: type === "expense" ? categoryId : undefined,
      categoryName,
      categoryColor,
      date: date ? ymdToUTCNoon(date) : new Date(),
      time: time ?? "",
      source: source ?? undefined,
      isDeleted: false,
    });

    const updated = await Account.updateOne(
      { _id: accountId, userId, isDeleted: false },
      { $inc: { currentBalance: delta } },
    );

    if (updated.modifiedCount !== 1) {
      await Transaction.updateOne(
        { _id: tx._id },
        { $set: { isDeleted: true } },
      );
      return res.status(400).json({ message: "Failed to update balance" });
    }

    return res.status(201).json(tx);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const txId = new mongoose.Types.ObjectId(req.params.id);
    const patch = req.body ?? {};

    const tx = await Transaction.findOne({
      _id: txId,
      userId,
      isDeleted: { $ne: true },
    });

    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const oldAccount = await Account.findOne({
      _id: tx.accountId,
      userId,
      isDeleted: false,
    });

    if (!oldAccount)
      return res.status(404).json({ message: "Account not found" });

    const oldDelta = computeDelta(oldAccount.type, tx.type, tx.amount);

    const newAccountIdRaw = patch.accountId ?? tx.accountId;
    const newType = patch.type ?? tx.type;
    const newAmount = patch.amount ?? tx.amount;

    const newAccountId = new mongoose.Types.ObjectId(newAccountIdRaw);

    const newAccount = await Account.findOne({
      _id: newAccountId,
      userId,
      isDeleted: false,
    });

    if (!newAccount)
      return res.status(404).json({ message: "New account not found" });

    const newDelta = computeDelta(newAccount.type, newType, newAmount);

    if (patch.date) {
      const log = await getOrCreateMonthlyLog({
        userId,
        date: patch.date,
      });
      tx.logId = log._id;
      tx.date = ymdToUTCNoon(patch.date);
    }
    tx.accountId = newAccountId;
    tx.type = newType;
    tx.amount = Number(newAmount);

    if (patch.name !== undefined) tx.name = patch.name;

    if (newType === "expense") {
      if (patch.categoryId !== undefined) tx.categoryId = patch.categoryId;
    } else {
      tx.categoryId = undefined;
    }

    await tx.save();

    const sameAccount = String(oldAccount._id) === String(newAccount._id);

    if (sameAccount) {
      const diff = newDelta - oldDelta;
      if (diff !== 0) {
        await Account.updateOne(
          { _id: oldAccount._id },
          { $inc: { currentBalance: diff } },
        );
      }
    } else {
      await Account.updateOne(
        { _id: oldAccount._id },
        { $inc: { currentBalance: -oldDelta } },
      );

      await Account.updateOne(
        { _id: newAccount._id },
        { $inc: { currentBalance: newDelta } },
      );
    }

    return res.json(tx);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

export const getTransactionsByMonth = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);

    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return res.status(400).json({ message: "year and month are required" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const monthlyLog = await MonthlyLog.findOne({ userId, year, month });

    if (!monthlyLog) {
      return res.json({
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const [transactions, total] = await Promise.all([
      Transaction.find({
        userId,
        logId: monthlyLog._id,
        isDeleted: false,
      })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Transaction.countDocuments({
        userId,
        logId: monthlyLog._id,
        isDeleted: false,
      }),
    ]);

    return res.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
