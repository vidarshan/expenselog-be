import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    limit: { type: Number, required: true, min: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

budgetSchema.index(
  { userId: 1, year: 1, month: 1, categoryId: 1 },
  { unique: true },
);

export default mongoose.model("Budget", budgetSchema);
