const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");

const {
    getMyTickets,
    scanTicket,
    getEventCheckinSummary
} = require("../controllers/ticketController");

const router = express.Router();

router.get(
    "/me",
    requireAuth,
    getMyTickets
);

router.post(
    "/scan",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    scanTicket
);

router.get(
    "/events/:eventId/checkin-summary",
    requireAuth,
    requireRole(["ORGANIZER", "ADMIN"]),
    getEventCheckinSummary
);

module.exports = router;