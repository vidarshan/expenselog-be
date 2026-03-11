import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    type: { type: String, enum: ["cash", "bank", "credit"], required: true },
    initialBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

accountSchema.index(
  { userId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export default mongoose.model("Account", accountSchema);
