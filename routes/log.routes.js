const express = require("express");
const router = express.Router();

const logController = require("../controllers/logs.controller");
const authMiddleware = require("../middleware/auth.middleware");

router
  .route("/monthly")
  .get(authMiddleware, logController.getMonthlyLogs)
  .post(authMiddleware, logController.createMonthlyLog);
router.route("/yearly").get(authMiddleware, logController.getYearlyLogs);

module.exports = router;
