const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middleware/auth.middleware");

router
  .route("/")
  .get(authMiddleware, categoryController.getCategory)
  .post(authMiddleware, categoryController.createCategory);

router
  .route("/:id")
  .patch(authMiddleware, categoryController.updateCategory)
  .delete(authMiddleware, categoryController.deleteCategory);

module.exports = router;
