import express from "express";
import auth from "../middleware/auth.middleware.js";
import { getTransactionsByMonth } from "../controllers/analytics.controller.js";

const router = express.Router();

router.route("/").get(auth, getTransactionsByMonth);

export default router;
