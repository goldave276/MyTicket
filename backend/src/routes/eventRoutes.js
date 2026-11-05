const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");

const {
    createEvent,
    getMyEvents,
    updateEvent,
    submitEvent,
    cancelEvent,
    getApprovedEvents,
    getPublicEventDetail,
    getOrganizerStats
} = require("../controllers/eventController");

const { getEventReservations } = require("../controllers/reservationController");

const router = express.Router();

router.post(
    "/",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    createEvent
);

router.get(
    "/me",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    getMyEvents
);

router.patch(
    "/:eventId/submit",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    submitEvent
);

router.get(
    "/stats",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    getOrganizerStats
);

router.patch(
    "/:eventId",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    updateEvent
);

router.patch(
    "/:eventId/cancel",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    cancelEvent
);

router.get(
    "/:eventId/reservations",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    getEventReservations
);


router.get(
    "/approved",
    getApprovedEvents
);

router.get(
    "/:eventId",
    getPublicEventDetail
);

module.exports = router;
