import express from "express";
import {
  getTransactionsByMonth,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(auth, getTransactionsByMonth)
  .post(auth, createTransaction);

router
  .route("/:id")
  .patch(auth, updateTransaction)
  .delete(auth, deleteTransaction);

export default router;
