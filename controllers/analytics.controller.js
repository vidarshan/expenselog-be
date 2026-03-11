import Transaction from "../models/Transaction.js";

export const getTransactionsByMonth = async (req, res) => {
  try {
    const userId = req.userId;

    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const start = new Date(today);
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: start, $lte: end },
    }).lean();

    const map = new Map();

    for (const tx of transactions) {
      const day = new Date(tx.date).toISOString().slice(0, 10);

      if (!map.has(day)) {
        map.set(day, {
          date: day,
          count: 0,
          total: 0,
        });
      }

      const entry = map.get(day);
      entry.count += 1;
      entry.total += Number(tx.amount || 0);
    }

    const result = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const day = cursor.toISOString().slice(0, 10);

      result.push(
        map.get(day) || {
          date: day,
          count: 0,
          total: 0,
        },
      );

      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Failed to fetch heatmap data",
    });
  }
};
