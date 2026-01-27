const mongoose = require("mongoose");

const monthlyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

monthlyLogSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("MonthlyLog", monthlyLogSchema);
