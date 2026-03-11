import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    logId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonthlyLog",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: function () {
        return this.type === "expense";
      },
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    categoryColor: {
      type: String,
      default: "blue",
    },
    categoryName: {
      type: String,
      required: function () {
        return this.type === "expense";
      },
      default: "",
    },
    date: { type: Date, required: true },
    time: {
      type: String,
      default: "",
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
transactionSchema.index({ userId: 1, logId: 1, date: -1 });
transactionSchema.index({ userId: 1, logId: 1, type: 1 });
transactionSchema.index({ userId: 1, logId: 1, categoryId: 1 });

export default mongoose.model("Transaction", transactionSchema);
