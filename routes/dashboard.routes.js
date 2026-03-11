import express from "express";
import {
  getDashboard,
  getCategoryComparison,
} from "../controllers/dashboard.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(auth, getDashboard);

router.route("/compare").get(auth, getCategoryComparison);

export default router;
