import express from "express";
import { register, login, update, me } from "../controllers/auth.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.patch("/update", auth, update);
router.get("/me", auth, me);

export default router;
