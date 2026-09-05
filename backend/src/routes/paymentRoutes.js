const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");

const {
    createPayment,
    getMyPayments
} = require("../controllers/paymentController");

const router = express.Router();

router.get(
    "/me",
    requireAuth,
    getMyPayments
);

router.post(
    "/",
    requireAuth,
    createPayment
);

module.exports = router;