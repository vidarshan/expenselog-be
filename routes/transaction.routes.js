const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");

router
  .route("/")
  .get(authMiddleware, transactionController.getTransactionsByMonth)
  .post(authMiddleware, transactionController.createTransaction);

module.exports = router;
