import mongoose from "mongoose";

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
    aiInsights: {
      insights: [String],
      suggestions: [String],
      risk_flags: [String],
      positive_note: String,
      updatedAt: Date,
    },
  },
  { timestamps: true },
);

monthlyLogSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model("MonthlyLog", monthlyLogSchema);
