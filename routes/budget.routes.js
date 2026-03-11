import express from "express";
import {
  getBudgetOverview,
  createOrEditBudget,
  deleteBudget,
} from "../controllers/budget.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(auth, getBudgetOverview).post(auth, createOrEditBudget);

router.route("/:id").delete(auth, deleteBudget);

export default router;
