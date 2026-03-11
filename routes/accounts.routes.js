import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../controllers/accounts.controller.js";

const router = express.Router();

router.route("/").get(auth, getAccounts).post(auth, createAccount);
router.route("/:id").patch(auth, updateAccount).delete(auth, deleteAccount);

export default router;
