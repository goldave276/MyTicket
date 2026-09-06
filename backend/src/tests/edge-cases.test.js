require("dotenv").config();

const request = require("supertest");
const app = require("../App");

describe("Tests de robustesse et cas limites (Edge Cases)", () => {
    describe("Cas limites : Authentification", () => {
        it("refuse la connexion avec email ou mot de passe vide", async () => {
            const response1 = await request(app)
                .post("/api/auth/login")
                .send({ email: "", password: "password123" });
            expect(response1.status).toBe(400);

            const response2 = await request(app)
                .post("/api/auth/login")
                .send({ email: "test@example.com", password: "" });
            expect(response2.status).toBe(400);
        });

        it("refuse l'inscription avec champs manquants", async () => {
            const response = await request(app)
                .post("/api/auth/signup")
                .send({ email: "invalid-user" });
            expect(response.status).toBe(400);
        });

        it("refuse la demande de reinitialisation de mot de passe sans email", async () => {
            const response = await request(app)
                .post("/api/auth/password-reset")
                .send({});
            expect(response.status).toBe(400);
        });
    });

    describe("Cas limites : Evenements", () => {
        it("refuse la consultation des evenements avec des filtres invalides en 400 immediat", async () => {
            const response = await request(app)
                .get("/api/events/approved?minPrice=notanumber&maxPrice=invalid");
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Filtres invalides");
            expect(response.body.errors.minPrice).toBeDefined();
            expect(response.body.errors.maxPrice).toBeDefined();
        });

        it("refuse si minPrice > maxPrice", async () => {
            const response = await request(app)
                .get("/api/events/approved?minPrice=5000&maxPrice=1000");
            expect(response.status).toBe(400);
            expect(response.body.errors.minPrice).toBeDefined();
        });
    });

    describe("Cas limites : Routes inconnues et methodes HTTP non supportees", () => {
        it("retourne 404 pour des URLs inexistantes", async () => {
            const response = await request(app).get("/api/unknown/endpoint/404");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Route introuvable");
        });

        it("repond correctement au endpoint health", async () => {
            const response = await request(app).get("/api/health");
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("API MyTicket operationnelle");
        });
    });
});
