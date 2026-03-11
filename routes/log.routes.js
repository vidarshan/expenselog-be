import express from "express";
import {
  getMonthlyLogs,
  createMonthlyLog,
  getYearlyLogs,
  getActivePeriods,
} from "../controllers/logs.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/monthly").get(auth, getMonthlyLogs).post(auth, createMonthlyLog);

router.route("/yearly").get(auth, getYearlyLogs);

router.route("/active").get(auth, getActivePeriods);

export default router;
