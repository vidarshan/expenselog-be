import express from "express";
import {
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(auth, getCategory).post(auth, createCategory);

router.route("/:id").patch(auth, updateCategory).delete(auth, deleteCategory);

export default router;
