import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    insights: { type: mongoose.Schema.Types.Mixed, required: true },
    summaryHash: String,
  },
  { timestamps: true },
);

insightSchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.model("Insight", insightSchema);
