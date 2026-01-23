require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const colors = require("colors");

const User = require("../models/User");
const MonthlyLog = require("../models/MonthlyLog");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");

async function seed() {
  try {
    console.log(colors.yellow("seeding data..."));

    await mongoose.connect(process.env.MONGO_URI);

    await Promise.all([
      User.deleteMany(),
      MonthlyLog.deleteMany(),
      Transaction.deleteMany(),
      Category.deleteMany(),
    ]);
    const password = await bcrypt.hash("password123", 10);

    const user = await User.create({
      email: "test@expenselog.com",
      username: "Test User",
      password,
      salary: {
        type: "variable",
        fixed: {},
        variable: [
          { name: "Main Job", amount: 45000 },
          { name: "Freelance", amount: 15000 },
        ],
      },
    });

    const [food, job, freelance] = await Category.insertMany([
      { name: "Food", userId: user._id },
      { name: "Job", userId: user._id },
      { name: "Freelance", userId: user._id },
    ]);
    const mainJobSource = user.salary.variable[0]._id;
    const freelanceSource = user.salary.variable[1]._id;
    const now = new Date();

    const log = await MonthlyLog.create({
      userId: user._id,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
    await Transaction.insertMany([
      {
        userId: user._id,
        logId: log._id,
        name: "Salary Payment",
        amount: 3000,
        type: "income",
        category: job._id,
        source: mainJobSource,
        date: now,
      },
      {
        userId: user._id,
        logId: log._id,
        name: "Freelance Project",
        amount: 1200,
        type: "income",
        category: freelance._id,
        source: freelanceSource,
        date: now,
      },
      {
        userId: user._id,
        logId: log._id,
        name: "Groceries",
        amount: 150,
        type: "expense",
        category: food._id,
        date: now,
      },
    ]);

    console.log(colors.green("seeding complete..."));
    process.exit(0);
  } catch (err) {
    console.error("Seeder failed:", err);
    process.exit(1);
  }
}

seed();
