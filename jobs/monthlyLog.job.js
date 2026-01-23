const cron = require("node-cron");
const User = require("../models/User");
const MonthlyLog = require("../models/MonthlyLog");

cron.schedule(process.env.CRON_SCHEDULE, async () => {
  console.log("Running monthly log creation job");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-based JS month

  try {
    const users = await User.find({}, "_id");

    for (const user of users) {
      await MonthlyLog.updateOne(
        { userId: user._id, year, month },
        {
          $setOnInsert: {
            userId: user._id,
            year,
            month,
          },
        },
        { upsert: true },
      );
    }

    console.log("Monthly logs ensured for all users");
  } catch (err) {
    console.error("Monthly log job failed:", err);
  }
});
