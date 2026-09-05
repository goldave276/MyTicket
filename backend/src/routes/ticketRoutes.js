const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");

const {
    getMyTickets
} = require("../controllers/ticketController");

const router = express.Router();

router.get(
    "/me",
    requireAuth,
    getMyTickets
);

module.exports = router;