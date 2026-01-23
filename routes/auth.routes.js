const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.patch("/update", authMiddleware, authController.update);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
