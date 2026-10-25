const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");

const {
    createPayment,
    getMyPayments,
    initiateCheckout,
    handleStripeWebhook,
    handleMobileMoneyWebhook
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

router.post(
    "/checkout",
    requireAuth,
    initiateCheckout
);

router.post(
    "/webhook/stripe",
    handleStripeWebhook
);

router.post(
    "/webhook/mobile-money",
    handleMobileMoneyWebhook
);

module.exports = router;