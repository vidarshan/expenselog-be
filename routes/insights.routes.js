import express from "express";
import { getInsights } from "../controllers/insights.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(auth, getInsights);

export default router;
