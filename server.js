import dotenv from "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import colors from "colors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import logRoutes from "./routes/log.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import insightsRoutes from "./routes/insights.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import accountRoutes from "./routes/accounts.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("tiny"));
}
const MODE = process.env.NODE_ENV;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    console.log(colors.yellow("MongoDB connected " + process.env.MONGO_URI)),
  )
  .catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/analytics", analyticsRoutes);

app.listen(PORT, () => {
  console.log(
    colors.bgGreen(`Server running on http://localhost:${PORT} on ${MODE}`),
  );
});
