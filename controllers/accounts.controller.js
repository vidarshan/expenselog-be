import mongoose from "mongoose";
import Account from "../models/Account.js";

export const getAccounts = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const accounts = await Account.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(accounts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const { name, type, initialBalance = 0, creditLimit = 0 } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "name and type are required" });
    }

    const doc = await Account.create({
      userId,
      name: name.trim(),
      type,
      initialBalance: Number(initialBalance) || 0,
      currentBalance: Number(initialBalance) || 0,
      creditLimit: Number(creditLimit) || 0,
      isDeleted: false,
    });

    return res.status(201).json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Account name already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const id = new mongoose.Types.ObjectId(req.params.id);

    const { name, type, creditLimit, initialBalance } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (type !== undefined) updates.type = type;
    if (creditLimit !== undefined)
      updates.creditLimit = Number(creditLimit) || 0;

    if (initialBalance !== undefined)
      updates.initialBalance = Number(initialBalance) || 0;

    const updated = await Account.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!updated) return res.status(404).json({ message: "Account not found" });

    return res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Account name already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
};
export const deleteAccount = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const id = new mongoose.Types.ObjectId(req.params.id);

    const updated = await Account.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
