require("dotenv").config();
const express = require("express");
const colors = require("colors");
const morgan = require("morgan");
require("./jobs/monthlyLog.job");
const { default: mongoose } = require("mongoose");
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
  res.send("Server is running 🚀");
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/logs", require("./routes/log.routes"));
app.use("/api/transactions", require("./routes/transaction.routes"));

app.listen(PORT, () => {
  console.log(
    colors.bgGreen(`Server running on http://localhost:${PORT} on ${MODE}`),
  );
});
