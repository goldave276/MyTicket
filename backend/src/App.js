const authRoutes = require("./routes/authRoutes");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        message: "API MyTicket operationnelle"
    });
});

module.exports = app;