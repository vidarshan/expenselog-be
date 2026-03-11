//AI generated sample data for a typical user: student
import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import Account from "../models/Account.js";
import MonthlyLog from "../models/MonthlyLog.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

dotenv.config();

const USER_ID = new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0a8");

const CATEGORY_COLORS = {
  Food: "orange",
  Transport: "cyan",
  Housing: "grape",
  Utilities: "yellow",
  Shopping: "pink",
  Entertainment: "violet",
  Health: "red",
  Salary: "green",
  Freelance: "teal",
};

const CATEGORY_IDS = {
  Food: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0aa"),
  Transport: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0ab"),
  Housing: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0ac"),
  Utilities: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0ad"),
  Shopping: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0ae"),
  Entertainment: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0af"),
  Health: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0b0"),
  Salary: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0b1"),
  Freelance: new mongoose.Types.ObjectId("69b0fdb5928997ddf463d0b2"),
};

const CATEGORY_NAMES = {
  Food: "Food",
  Transport: "Transport",
  Housing: "Housing",
  Utilities: "Utilities",
  Shopping: "Shopping",
  Entertainment: "Entertainment",
  Health: "Health",
  Salary: "Salary",
  Freelance: "Freelance",
};

function monthStart(year, month) {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
}

function dateInMonth(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function ymKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function seeded(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function between(seed, min, max) {
  return round2(min + seeded(seed) * (max - min));
}

function monthSeries(startYear, startMonth, count) {
  const out = [];
  let y = startYear;
  let m = startMonth;

  for (let i = 0; i < count; i++) {
    out.push({ year: y, month: m });
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function buildMonthlyBudget(year, month) {
  const key = year * 100 + month;

  const food = round2(between(key + 1, 240, 360));
  const transport = round2(between(key + 2, 70, 140));
  const housing = 650;
  const utilities = round2(between(key + 3, 50, 95));
  const shopping = round2(between(key + 4, 60, 180));
  const entertainment = round2(between(key + 5, 40, 120));
  const health = round2(between(key + 6, 20, 80));

  return [
    { category: "Food", limit: food },
    { category: "Transport", limit: transport },
    { category: "Housing", limit: housing },
    { category: "Utilities", limit: utilities },
    { category: "Shopping", limit: shopping },
    { category: "Entertainment", limit: entertainment },
    { category: "Health", limit: health },
  ];
}

function buildMonthlyTransactions(year, month, accountIds) {
  const key = year * 100 + month;
  const tx = [];

  // part-time income
  const monthlyPay =
    month >= 9 || month <= 4
      ? round2(between(key + 11, 1450, 2100))
      : round2(between(key + 11, 950, 1650));

  tx.push({
    name: "Part-time Pay",
    amount: monthlyPay,
    type: "income",
    category: "Salary",
    accountId: accountIds.chequing,
    date: dateInMonth(year, month, 3),
  });

  // occasional second paycheck
  if (seeded(key + 12) > 0.45) {
    tx.push({
      name: "Extra Shift Pay",
      amount: round2(between(key + 13, 180, 520)),
      type: "income",
      category: "Salary",
      accountId: accountIds.chequing,
      date: dateInMonth(year, month, 18),
    });
  }

  // occasional freelance
  if (seeded(key + 14) > 0.62) {
    tx.push({
      name: "Freelance Work",
      amount: round2(between(key + 15, 120, 650)),
      type: "income",
      category: "Freelance",
      accountId: accountIds.savings,
      date: dateInMonth(year, month, 22),
    });
  }

  // fixed-ish expenses
  tx.push({
    name: "Rent",
    amount: 650,
    type: "expense",
    category: "Housing",
    accountId: accountIds.chequing,
    date: dateInMonth(year, month, 1),
  });

  tx.push({
    name: "Phone & Internet",
    amount: round2(between(key + 21, 55, 82)),
    type: "expense",
    category: "Utilities",
    accountId: accountIds.chequing,
    date: dateInMonth(year, month, 7),
  });

  tx.push({
    name: "Transit Pass",
    amount: round2(between(key + 22, 70, 125)),
    type: "expense",
    category: "Transport",
    accountId: accountIds.chequing,
    date: dateInMonth(year, month, 2),
  });

  // food weekly
  const foodWeeks = [5, 11, 18, 25];
  for (let i = 0; i < foodWeeks.length; i++) {
    tx.push({
      name: i % 2 === 0 ? "Groceries" : "Dining Out",
      amount: round2(between(key + 30 + i, 35, 110)),
      type: "expense",
      category: "Food",
      accountId: i % 2 === 0 ? accountIds.chequing : accountIds.credit,
      date: dateInMonth(year, month, Math.min(foodWeeks[i], 28)),
    });
  }

  // shopping
  if (seeded(key + 40) > 0.25) {
    tx.push({
      name: "Shopping",
      amount: round2(between(key + 41, 30, 180)),
      type: "expense",
      category: "Shopping",
      accountId: accountIds.credit,
      date: dateInMonth(year, month, 14),
    });
  }

  // entertainment
  if (seeded(key + 50) > 0.35) {
    tx.push({
      name: "Entertainment",
      amount: round2(between(key + 51, 20, 95)),
      type: "expense",
      category: "Entertainment",
      accountId: accountIds.credit,
      date: dateInMonth(year, month, 20),
    });
  }

  // health, occasional
  if (seeded(key + 60) > 0.7) {
    tx.push({
      name: "Pharmacy / Health",
      amount: round2(between(key + 61, 18, 90)),
      type: "expense",
      category: "Health",
      accountId: accountIds.chequing,
      date: dateInMonth(year, month, 16),
    });
  }

  // cash food / misc
  if (seeded(key + 70) > 0.45) {
    tx.push({
      name: "Snacks / Coffee",
      amount: round2(between(key + 71, 8, 28)),
      type: "expense",
      category: "Food",
      accountId: accountIds.cash,
      date: dateInMonth(year, month, 9),
    });
  }

  // credit payment
  const creditPayment = round2(between(key + 80, 120, 320));
  tx.push({
    name: "Credit Card Payment",
    amount: creditPayment,
    type: "income",
    category: null,
    accountId: accountIds.credit,
    date: dateInMonth(year, month, 26),
  });

  return tx;
}

async function upsertDefaultAccounts() {
  const defs = [
    {
      name: "RBC Chequing",
      type: "bank",
      initialBalance: 850,
      creditLimit: 0,
    },
    {
      name: "RBC Savings",
      type: "bank",
      initialBalance: 1200,
      creditLimit: 0,
    },
    {
      name: "Student Mastercard",
      type: "credit",
      initialBalance: 0,
      creditLimit: 1500,
    },
    {
      name: "Cash on Hand",
      type: "cash",
      initialBalance: 120,
      creditLimit: 0,
    },
  ];

  const out = {};

  for (const def of defs) {
    const account = await Account.findOneAndUpdate(
      { userId: USER_ID, name: def.name },
      {
        $setOnInsert: {
          userId: USER_ID,
          name: def.name,
          type: def.type,
          initialBalance: def.initialBalance,
          currentBalance: def.initialBalance,
          creditLimit: def.creditLimit,
          isDeleted: false,
        },
      },
      { new: true, upsert: true },
    );

    if (def.name.includes("Chequing")) out.chequing = account._id;
    if (def.name.includes("Savings")) out.savings = account._id;
    if (def.name.includes("Mastercard")) out.credit = account._id;
    if (def.name.includes("Cash")) out.cash = account._id;
  }

  return out;
}

async function upsertMonthlyLog(year, month) {
  return MonthlyLog.findOneAndUpdate(
    { userId: USER_ID, year, month },
    {
      $setOnInsert: {
        userId: USER_ID,
        year,
        month,
        isClosed: false,
        aiInsights: {
          insights: [],
          suggestions: [],
          risk_flags: [],
        },
      },
    },
    { new: true, upsert: true },
  );
}

async function seedBudgets(periods) {
  for (const { year, month } of periods) {
    const budgets = buildMonthlyBudget(year, month);

    for (const row of budgets) {
      await Budget.findOneAndUpdate(
        {
          userId: USER_ID,
          year,
          month,
          categoryId: CATEGORY_IDS[row.category],
        },
        {
          $set: {
            userId: USER_ID,
            year,
            month,
            categoryId: CATEGORY_IDS[row.category],
            categoryName: CATEGORY_NAMES[row.category],
            limit: row.limit,
            isDeleted: false,
          },
        },
        { new: true, upsert: true },
      );
    }
  }
}

async function seedTransactions(periods, accountIds) {
  for (const { year, month } of periods) {
    const log = await upsertMonthlyLog(year, month);
    const transactions = buildMonthlyTransactions(year, month, accountIds);

    for (const tx of transactions) {
      const payload = {
        userId: USER_ID,
        logId: log._id,
        name: tx.name,
        amount: tx.amount,
        type: tx.type,
        accountId: tx.accountId,
        date: tx.date,
        isDeleted: false,
      };

      if (tx.type === "expense" || tx.category) {
        payload.categoryId = tx.category
          ? CATEGORY_IDS[tx.category]
          : undefined;
        payload.categoryName = tx.category ? CATEGORY_NAMES[tx.category] : "";
        payload.categoryColor = tx.category
          ? CATEGORY_COLORS[tx.category]
          : "blue";
      } else {
        payload.categoryName = "";
        payload.categoryColor = "blue";
      }

      // avoid duplicates if rerun
      await Transaction.findOneAndUpdate(
        {
          userId: USER_ID,
          logId: log._id,
          name: tx.name,
          amount: tx.amount,
          date: tx.date,
        },
        { $setOnInsert: payload },
        { new: true, upsert: true },
      );
    }
  }
}

function computeDelta(accountType, txType, amount) {
  const amt = Number(amount);

  if (accountType === "cash" || accountType === "bank") {
    return txType === "income" ? amt : -amt;
  }

  if (accountType === "credit") {
    return txType === "expense" ? amt : -amt;
  }

  return 0;
}

async function recalcAccountBalances() {
  const accounts = await Account.find({ userId: USER_ID, isDeleted: false });
  const txs = await Transaction.find({
    userId: USER_ID,
    isDeleted: { $ne: true },
  }).sort({ date: 1, createdAt: 1 });

  const accountMap = new Map(
    accounts.map((a) => [
      String(a._id),
      {
        doc: a,
        balance: Number(a.initialBalance || 0),
      },
    ]),
  );

  for (const tx of txs) {
    const found = accountMap.get(String(tx.accountId));
    if (!found) continue;

    found.balance += computeDelta(found.doc.type, tx.type, tx.amount);
  }

  for (const entry of accountMap.values()) {
    entry.doc.currentBalance = round2(entry.balance);
    await entry.doc.save();
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findById(USER_ID);
  if (!user) throw new Error("User not found");

  const accountIds = await upsertDefaultAccounts();

  const periods = monthSeries(2024, 4, 24);

  await seedBudgets(periods);
  await seedTransactions(periods, accountIds);
  await recalcAccountBalances();

  console.log("Seed complete");
  console.log("Accounts created/used:", accountIds);
  console.log("Months seeded:", periods[0], "to", periods[periods.length - 1]);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
