import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import User from "../models/User.js";
import Account from "../models/Account.js";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import MonthlyLog from "../models/MonthlyLog.js";
import Transaction from "../models/Transaction.js";
import Insight from "../models/Insight.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const EXPENSE_CATEGORIES = [
  { name: "Food", color: "orange" },
  { name: "Transport", color: "blue" },
  { name: "Housing", color: "grape" },
  { name: "Utilities", color: "cyan" },
  { name: "Shopping", color: "pink" },
  { name: "Entertainment", color: "violet" },
  { name: "Health", color: "red" },
  { name: "Education", color: "indigo" },
  { name: "Subscriptions", color: "teal" },
  { name: "Travel", color: "lime" },
  { name: "Phone", color: "yellow" },
  { name: "Personal Care", color: "green" },
];

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Chris",
  "Jamie",
  "Sam",
  "Cameron",
  "Riley",
  "Avery",
  "Ethan",
  "Sophia",
  "Noah",
  "Emma",
  "Liam",
  "Olivia",
  "Daniel",
  "Mia",
  "Lucas",
  "Charlotte",
];

const LAST_NAMES = [
  "Smith",
  "Brown",
  "Johnson",
  "Williams",
  "Jones",
  "Miller",
  "Davis",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
];

const ACCOUNT_NAME_BANK = [
  "Main Bank",
  "Everyday Chequing",
  "Spending Account",
  "Primary Bank",
  "Student Chequing",
];

const ACCOUNT_NAME_CASH = ["Wallet", "Cash", "Daily Cash", "Pocket Cash"];

const ACCOUNT_NAME_CREDIT = [
  "Visa",
  "Mastercard",
  "Rewards Card",
  "Student Credit Card",
  "Travel Credit Card",
];

const MERCHANTS = {
  Food: [
    "Tim Hortons",
    "Starbucks",
    "McDonald's",
    "Subway",
    "A&W",
    "Walmart Groceries",
    "Save-On-Foods",
    "Costco",
    "Superstore",
    "FreshCo",
    "DoorDash",
    "Uber Eats",
  ],
  Transport: [
    "Compass Card",
    "Uber",
    "Lyft",
    "Esso",
    "Shell",
    "Petro-Canada",
    "Parking Meter",
    "Bus Pass Reload",
  ],
  Housing: ["Monthly Rent", "Rent Payment", "Strata Fee", "Tenant Insurance"],
  Utilities: ["BC Hydro", "Internet Bill", "Water Utility"],
  Shopping: [
    "Amazon",
    "Walmart",
    "Dollarama",
    "Best Buy",
    "H&M",
    "Uniqlo",
    "Costco",
  ],
  Entertainment: [
    "Netflix",
    "Spotify",
    "Cineplex",
    "Steam",
    "PlayStation Store",
    "Apple Music",
  ],
  Health: [
    "Shoppers Drug Mart",
    "Pharmacy",
    "Dental Visit",
    "Walk-in Clinic",
    "Supplement Store",
  ],
  Education: [
    "Douglas College",
    "Textbook Purchase",
    "Udemy",
    "Coursera",
    "School Supplies",
  ],
  Subscriptions: [
    "Netflix",
    "Spotify",
    "YouTube Premium",
    "Google One",
    "iCloud",
    "ChatGPT",
  ],
  Travel: ["Air Canada", "BC Ferries", "Booking.com", "Expedia", "Hotel Stay"],
  Phone: ["Telus", "Rogers", "Bell", "Freedom Mobile", "Fido"],
  "Personal Care": ["Salon", "Barber", "Skincare", "Toiletries", "Sephora"],
};

const INCOME_SOURCES = [
  "Salary Deposit",
  "Part-time Pay",
  "Freelance Payment",
  "Tutoring Income",
  "Contract Payment",
  "Side Hustle Income",
  "Scholarship Deposit",
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(prob = 0.5) {
  return Math.random() < prob;
}

function randomAmount(min, max, decimals = 2) {
  const n = Math.random() * (max - min) + min;
  return Number(n.toFixed(decimals));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
}

function startOfMonth(year, month) {
  return new Date(year, month - 1, 1);
}

function endOfMonth(year, month) {
  return new Date(year, month, 0);
}

function randomDateInMonth(year, month) {
  const start = startOfMonth(year, month).getTime();
  const end = endOfMonth(year, month).getTime();
  return new Date(rand(start, end));
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildMonthRange(monthsBack = 12) {
  const now = new Date();
  const months = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }

  return months;
}

function getUserProfile(index) {
  const profiles = [
    "student",
    "student",
    "student",
    "working",
    "working",
    "working",
    "highSpender",
    "highSpender",
    "working",
    "student",
  ];

  return profiles[index % profiles.length];
}

function buildSalary(profile) {
  if (profile === "student") {
    if (maybe(0.65)) {
      return {
        type: "fixed",
        fixed: {
          amount: rand(1200, 2200),
        },
      };
    }

    return {
      type: "variable",
      variable: [
        { name: "Part-time Job", amount: rand(700, 1400) },
        { name: "Side Income", amount: rand(150, 500) },
      ],
    };
  }

  if (profile === "working") {
    if (maybe(0.75)) {
      return {
        type: "fixed",
        fixed: {
          amount: rand(3500, 6500),
        },
      };
    }

    return {
      type: "variable",
      variable: [
        { name: "Base Pay", amount: rand(2500, 4500) },
        { name: "Commission", amount: rand(300, 1200) },
      ],
    };
  }

  return {
    type: "fixed",
    fixed: {
      amount: rand(7000, 12000),
    },
  };
}

function buildAccounts(profile) {
  const accounts = [];

  // Always one bank account
  accounts.push({
    name: pick(ACCOUNT_NAME_BANK),
    type: "bank",
    initialBalance:
      profile === "student"
        ? rand(100, 1200)
        : profile === "working"
          ? rand(800, 4000)
          : rand(2000, 12000),
    creditLimit: 0,
  });

  // Maybe cash
  if (maybe(profile === "student" ? 0.7 : 0.45)) {
    accounts.push({
      name: pick(ACCOUNT_NAME_CASH),
      type: "cash",
      initialBalance: rand(20, 350),
      creditLimit: 0,
    });
  }

  // Often credit
  if (maybe(profile === "student" ? 0.65 : 0.85)) {
    accounts.push({
      name: pick(ACCOUNT_NAME_CREDIT),
      type: "credit",
      initialBalance: 0,
      creditLimit:
        profile === "student"
          ? rand(500, 2000)
          : profile === "working"
            ? rand(2000, 7000)
            : rand(5000, 15000),
    });
  }

  // Optional extra bank/credit
  if (maybe(profile === "highSpender" ? 0.85 : 0.35)) {
    const extraType = maybe(0.6) ? "bank" : "credit";
    accounts.push({
      name:
        extraType === "bank"
          ? `${pick(ACCOUNT_NAME_BANK)} 2`
          : `${pick(ACCOUNT_NAME_CREDIT)} 2`,
      type: extraType,
      initialBalance: extraType === "bank" ? rand(500, 5000) : 0,
      creditLimit: extraType === "credit" ? rand(2500, 10000) : 0,
    });
  }

  // Max 5 accounts
  return accounts.slice(0, rand(2, Math.min(5, accounts.length)));
}

function getTransactionCount(profile) {
  if (profile === "student") return rand(60, 140);
  if (profile === "working") return rand(100, 220);
  return rand(180, 320);
}

function expenseRangeForCategory(profile, categoryName) {
  const base = {
    Food: [5, 45],
    Transport: [3, 70],
    Housing: [500, 2200],
    Utilities: [40, 220],
    Shopping: [10, 180],
    Entertainment: [8, 90],
    Health: [10, 120],
    Education: [20, 900],
    Subscriptions: [5, 30],
    Travel: [60, 800],
    Phone: [35, 110],
    "Personal Care": [10, 90],
  };

  const [minBase, maxBase] = base[categoryName] || [5, 50];

  if (profile === "student") return [minBase, maxBase];
  if (profile === "working") return [minBase * 1.15, maxBase * 1.35];
  return [minBase * 1.5, maxBase * 2.5];
}

function pickExpenseCategoryWeighted(categoryDocs, profile) {
  const weightsByProfile = {
    student: {
      Food: 20,
      Transport: 10,
      Housing: 10,
      Utilities: 5,
      Shopping: 10,
      Entertainment: 12,
      Health: 4,
      Education: 9,
      Subscriptions: 6,
      Travel: 3,
      Phone: 6,
      "Personal Care": 5,
    },
    working: {
      Food: 18,
      Transport: 12,
      Housing: 14,
      Utilities: 8,
      Shopping: 10,
      Entertainment: 8,
      Health: 6,
      Education: 3,
      Subscriptions: 5,
      Travel: 4,
      Phone: 6,
      "Personal Care": 6,
    },
    highSpender: {
      Food: 16,
      Transport: 10,
      Housing: 12,
      Utilities: 6,
      Shopping: 16,
      Entertainment: 12,
      Health: 5,
      Education: 2,
      Subscriptions: 5,
      Travel: 8,
      Phone: 4,
      "Personal Care": 4,
    },
  };

  const weights = weightsByProfile[profile];
  const pool = [];

  for (const category of categoryDocs) {
    const w = weights[category.name] || 1;
    for (let i = 0; i < w; i++) pool.push(category);
  }

  return pick(pool);
}

function buildInsightText(profile, monthName) {
  if (profile === "student") {
    return {
      insights: [
        `Food spending was active in ${monthName}, mostly from small frequent purchases.`,
        `Education and transport remain important spending areas.`,
      ],
      suggestions: [
        "Try a weekly food budget cap.",
        "Track recurring subscriptions more closely.",
      ],
      risk_flags: ["Frequent small expenses may add up quickly."],
      positive_note: "Income and spending pattern looks manageable overall.",
    };
  }

  if (profile === "working") {
    return {
      insights: [
        `Housing and food were the strongest recurring costs in ${monthName}.`,
        `Income flow appears relatively stable this month.`,
      ],
      suggestions: [
        "Consider setting tighter category budgets for shopping and food.",
        "Review utility and phone bills for recurring savings.",
      ],
      risk_flags: ["Lifestyle expenses may grow if not monitored monthly."],
      positive_note: "Cash flow remains healthy with decent category balance.",
    };
  }

  return {
    insights: [
      `Shopping, travel, and dining drove a large share of discretionary spending in ${monthName}.`,
      `Overall income appears strong enough to support the current spending pattern.`,
    ],
    suggestions: [
      "Set explicit upper limits for discretionary categories.",
      "Increase savings allocation from surplus income.",
    ],
    risk_flags: ["High discretionary spend may reduce long-term savings pace."],
    positive_note:
      "Strong income provides room to optimize savings and investment habits.",
  };
}

async function recalcAccountBalancesForUser(userId) {
  const accounts = await Account.find({ userId, isDeleted: false });
  const transactions = await Transaction.find({ userId, isDeleted: false });

  const txByAccount = new Map();

  for (const tx of transactions) {
    const key = String(tx.accountId);
    if (!txByAccount.has(key)) txByAccount.set(key, []);
    txByAccount.get(key).push(tx);
  }

  for (const account of accounts) {
    const accountTxs = txByAccount.get(String(account._id)) || [];
    let balance = account.initialBalance || 0;

    for (const tx of accountTxs) {
      if (account.type === "credit") {
        // Credit account: expense increases owed amount (more negative feeling)
        // We will represent balance as signed running value.
        if (tx.type === "expense") balance -= tx.amount;
        if (tx.type === "income") balance += tx.amount;
      } else {
        if (tx.type === "income") balance += tx.amount;
        if (tx.type === "expense") balance -= tx.amount;
      }
    }

    account.currentBalance = Number(balance.toFixed(2));
    await account.save();
  }
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PROD_SEED !== "true"
  ) {
    throw new Error(
      "Production seed blocked. Set ALLOW_PROD_SEED=true to continue.",
    );
  }
  // wipe previous data
  await Promise.all([
    Insight.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
    MonthlyLog.deleteMany({}),
    Account.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log("Old data cleared");

  const passwordPlain = "Password123!";
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  const months = buildMonthRange(12);

  for (let i = 0; i < 10; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const username = `${firstName} ${lastName}`;
    const email = `${slugify(firstName)}.${slugify(lastName)}${i + 1}@demo.com`;
    const profile = getUserProfile(i);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      role: i === 0 ? "admin" : "user",
      salary: buildSalary(profile),
    });

    // categories
    const categoryDocs = await Category.insertMany(
      EXPENSE_CATEGORIES.map((c) => ({
        userId: user._id,
        name: c.name,
        color: c.color,
      })),
    );

    const categoryMap = new Map(categoryDocs.map((c) => [c.name, c]));

    // monthly logs
    const monthlyLogs = await MonthlyLog.insertMany(
      months.map(({ year, month }) => ({
        userId: user._id,
        year,
        month,
        isClosed: maybe(0.85),
        aiInsights: {
          ...buildInsightText(
            profile,
            `${year}-${String(month).padStart(2, "0")}`,
          ),
          updatedAt: new Date(),
        },
      })),
    );

    const logMap = new Map(
      monthlyLogs.map((log) => [`${log.year}-${log.month}`, log]),
    );

    // optional separate insight documents
    await Insight.insertMany(
      months.map(({ year, month }) => ({
        userId: user._id,
        month: `${year}-${String(month).padStart(2, "0")}`,
        insights: buildInsightText(
          profile,
          `${year}-${String(month).padStart(2, "0")}`,
        ),
        summaryHash: `${user._id}-${year}-${month}`,
      })),
    );

    // accounts
    const accountsData = buildAccounts(profile);
    const accountDocs = [];

    for (const a of accountsData) {
      const created = await Account.create({
        userId: user._id,
        name: a.name,
        type: a.type,
        initialBalance: a.initialBalance,
        currentBalance: a.initialBalance,
        creditLimit: a.creditLimit,
      });
      accountDocs.push(created);
    }

    // budgets per month for some categories
    const budgetDocs = [];
    for (const { year, month } of months) {
      const budgetCategoryCount = rand(4, 7);
      const shuffled = [...categoryDocs].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, budgetCategoryCount);

      for (const cat of selected) {
        let limit = 0;

        switch (cat.name) {
          case "Housing":
            limit = profile === "student" ? rand(600, 1100) : rand(1200, 2600);
            break;
          case "Food":
            limit = profile === "student" ? rand(150, 400) : rand(300, 700);
            break;
          case "Transport":
            limit = profile === "student" ? rand(50, 180) : rand(120, 350);
            break;
          case "Shopping":
            limit =
              profile === "highSpender" ? rand(500, 1200) : rand(120, 400);
            break;
          case "Entertainment":
            limit = profile === "highSpender" ? rand(250, 700) : rand(60, 250);
            break;
          default:
            limit = rand(50, 350);
        }

        budgetDocs.push({
          userId: user._id,
          year,
          month,
          categoryId: cat._id,
          limit,
          isDeleted: false,
        });
      }
    }

    if (budgetDocs.length) {
      await Budget.insertMany(budgetDocs, { ordered: false });
    }

    // transactions
    const totalTransactions = getTransactionCount(profile);
    const txDocs = [];

    for (let t = 0; t < totalTransactions; t++) {
      const monthObj = pick(months);
      const date = randomDateInMonth(monthObj.year, monthObj.month);
      date.setHours(rand(7, 22), rand(0, 59), 0, 0);

      const log = logMap.get(`${monthObj.year}-${monthObj.month}`);
      const account = pick(accountDocs);

      const doIncome = maybe(
        profile === "student" ? 0.18 : profile === "working" ? 0.22 : 0.16,
      );

      if (doIncome) {
        let amount = 0;

        if (profile === "student") {
          amount = randomAmount(80, 900);
        } else if (profile === "working") {
          amount = randomAmount(300, 2800);
        } else {
          amount = randomAmount(800, 5000);
        }

        txDocs.push({
          userId: user._id,
          logId: log._id,
          name: pick(INCOME_SOURCES),
          amount,
          type: "income",
          accountId: account._id,
          categoryColor: "green",
          categoryName: "",
          date,
          time: formatTime(date),
          isDeleted: false,
        });
      } else {
        const category = pickExpenseCategoryWeighted(categoryDocs, profile);
        const [minAmount, maxAmount] = expenseRangeForCategory(
          profile,
          category.name,
        );
        let amount = randomAmount(minAmount, maxAmount);

        // make rent-like/housing more realistic
        if (category.name === "Housing" && maybe(0.75)) {
          amount =
            profile === "student"
              ? randomAmount(650, 1100)
              : profile === "working"
                ? randomAmount(1200, 2400)
                : randomAmount(1800, 3500);
        }

        // subscriptions usually smaller
        if (category.name === "Subscriptions") {
          amount = randomAmount(5, 30);
        }

        // phone usually monthly-ish
        if (category.name === "Phone") {
          amount = randomAmount(35, 110);
        }

        const merchantList = MERCHANTS[category.name] || ["General Expense"];

        txDocs.push({
          userId: user._id,
          logId: log._id,
          name: pick(merchantList),
          amount,
          type: "expense",
          categoryId: category._id,
          accountId: account._id,
          categoryColor: category.color || "blue",
          categoryName: category.name,
          date,
          time: formatTime(date),
          isDeleted: false,
        });
      }
    }

    await Transaction.insertMany(txDocs);

    await recalcAccountBalancesForUser(user._id);

    console.log(`Seeded user ${i + 1}/10 -> ${email} (${profile})`);
  }

  console.log("\nSeed complete.");
  console.log(`All users use password: ${passwordPlain}`);

  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
