const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");

const {
    createReservation,
    getMyReservations,
    cancelReservation
} = require("../controllers/reservationController");

const router = express.Router();

router.get(
    "/me",
    requireAuth,
    getMyReservations
);

router.post(
    "/",
    requireAuth,
    createReservation
);

router.patch(
    "/:reservationId/cancel",
    requireAuth,
    cancelReservation
);

module.exports = router;