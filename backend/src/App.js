const adminRoutes = require("./routes/adminRoutes");

const organizerRequestRoutes = require("./routes/organizerRequestRoutes");

const authRoutes = require("./routes/authRoutes");

const eventRoutes = require("./routes/eventRoutes");

const reservationRoutes = require("./routes/reservationRoutes");

const ticketRoutes = require("./routes/ticketRoutes");

const paymentRoutes = require("./routes/paymentRoutes");




const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// A activer uniquement derriere un proxy unique de confiance (Render, Railway,
// Nginx configure comme unique saut). Sans ce reglage, le rate limiting voit
// l'IP du proxy au lieu de celle du client.
if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
}

const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:3333,http://localhost:3001";
const allowedOrigins = rawFrontendUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// Vérification de sécurité pour la production
if (process.env.NODE_ENV === "production" && allowedOrigins.includes("*")) {
    throw new Error(
        "Configuration CORS invalide en production : le wildcard '*' est interdit avec credentials: true."
    );
}

app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans en-tête Origin (ex: curl, healthchecks internes, jobs serveurs)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== "production" && allowedOrigins.includes("*"))) {
            return callback(null, true);
        }
        const corsErr = new Error("Origine non autorisee par la politique CORS");
        corsErr.code = "CORS_ORIGIN_DENIED";
        corsErr.status = 403;
        return callback(corsErr);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Assurer l'en-tête Vary: Origin pour éviter les caches partagés erronés
app.use((req, res, next) => {
    res.setHeader("Vary", "Origin");
    next();
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));


app.use("/api/auth", authRoutes);
app.use("/api/organizer-requests",
    organizerRequestRoutes
);

app.use("/api/admin", adminRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/reservations", reservationRoutes);

app.use("/api/tickets", ticketRoutes);

app.use("/api/payments", paymentRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        message: "API MyTicket operationnelle"
    });
});

// Réponse standard quand aucune route ne correspond.
app.use((req, res) => {
    res.status(404).json({
        message: "Route introuvable"
    });
});

// Gestion centralisée des erreurs inattendues.
app.use((err, req, res, next) => {
    if (err.code === "CORS_ORIGIN_DENIED" || err.status === 403) {
        return res.status(403).json({
            message: "Origine non autorisee"
        });
    }

    console.error(err);

    res.status(500).json({
        message: "Erreur interne du serveur"
    });
});

module.exports = app;
