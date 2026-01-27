const express = require("express");
const router = express.Router();

const logController = require("../controllers/logs.controller");
const authMiddleware = require("../middleware/auth.middleware");

router
  .route("/")
  .get(authMiddleware, logController.getMonthlyLogs)
  .post(authMiddleware, logController.createMonthlyLog);

module.exports = router;
