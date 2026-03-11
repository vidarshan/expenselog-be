import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    salary: {
      type: {
        type: String,
        enum: ["fixed", "variable"],
        required: true,
      },
      fixed: {
        amount: {
          type: Number,
        },
      },
      variable: [
        {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true,
          },
          name: {
            type: String,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
