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

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3001")
    .split(",")
    .map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            return callback(null, true);
        }
        return callback(new Error("Origine non autorisee par la politique CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

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
    console.error(err);

    res.status(500).json({
        message: "Erreur interne du serveur"
    });
});

module.exports = app;
