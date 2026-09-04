require("dotenv").config();

const app = require("./App");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur demarre sur http://localhost:${PORT}`);
});