const express = require("express");
const rateLimit = require("express-rate-limit");
const requireAuth = require("../middlewares/authMiddleware");
const {
    login,
    getMe
} = require("../controllers/authController");


const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Trop de tentatives de connexion, reessayez plus tard"
    }
});

router.post("/login", loginLimiter, login);

router.get("/me", requireAuth, getMe);



module.exports = router;
