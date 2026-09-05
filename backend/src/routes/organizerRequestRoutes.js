const express = require("express");
const requireAuth = require("../middlewares/authMiddleware");
const {
    createOrganizerRequest,
    getMyOrganizerRequests
} = require("../controllers/organizerRequestController");

const router = express.Router();

router.get("/", requireAuth, getMyOrganizerRequests);
router.post("/", requireAuth, createOrganizerRequest);

module.exports = router;