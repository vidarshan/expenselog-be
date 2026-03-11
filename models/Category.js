import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "blue",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);
categorySchema.index(
  { userId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export default mongoose.model("Category", categorySchema);
