const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");

const {
    createEvent,
    getMyEvents,
    submitEvent,
    rejectEvent,
    getApprovedEvents
} = require("../controllers/eventController");

const router = express.Router();

router.post(
    "/",
    requireAuth,
    requireRole("ORGANIZER"),
    createEvent
);

router.get(
    "/me",
    requireAuth,
    requireRole("ORGANIZER"),
    getMyEvents
);

router.patch(
    "/:eventId/submit",
    requireAuth,
    requireRole("ORGANIZER"),
    submitEvent
);


router.get(
    "/approved",
    getApprovedEvents
);

module.exports = router;