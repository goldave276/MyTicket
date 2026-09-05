const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");

const {
    getPendingEvents,
    approveEvent,
    rejectEvent
} = require("../controllers/eventController");

const {
    getAllOrganizerRequests,
    approveOrganizerRequest,
    rejectOrganizerRequest
} = require("../controllers/organizerRequestController");

const {
    getPendingPayments,
    confirmOnSitePayment
} = require("../controllers/paymentController");





const router = express.Router();

router.get(
    "/organizer-requests",
    requireAuth,
    requireRole("ADMIN"),
    getAllOrganizerRequests
);

router.patch(
    "/organizer-requests/:requestId/approve",
    requireAuth,
    requireRole("ADMIN"),
    approveOrganizerRequest
);

router.patch(
    "/organizer-requests/:requestId/reject",
    requireAuth,
    requireRole("ADMIN"),
    rejectOrganizerRequest
);


router.get(
    "/events/pending",
    requireAuth,
    requireRole("ADMIN"),
    getPendingEvents
);

router.patch(
    "/events/:eventId/approve",
    requireAuth,
    requireRole("ADMIN"),
    approveEvent
);

router.patch(
    "/events/:eventId/reject",
    requireAuth,
    requireRole("ADMIN"),
    rejectEvent
);


router.get(
    "/payments/pending",
    requireAuth,
    requireRole("ADMIN"),
    getPendingPayments
);

router.patch(
    "/payments/:paymentId/confirm-onsite",
    requireAuth,
    requireRole("ADMIN"),
    confirmOnSitePayment
);


module.exports = router;
