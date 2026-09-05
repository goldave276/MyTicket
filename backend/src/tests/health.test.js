require("dotenv").config();

const request = require("supertest");
const app = require("../App");

describe("API health", () => {
    it("retourne 200 lorsque l'API fonctionne", async () => {
        const response = await request(app)
            .get("/api/health");

        expect(response.status).toBe(200);
        expect(response.body.message)
            .toBe("API MyTicket operationnelle");
        expect(response.headers["x-content-type-options"])
            .toBe("nosniff");
    });

    it("retourne 404 pour une route inconnue", async () => {
        const response = await request(app)
            .get("/api/route-inexistante");

        expect(response.status).toBe(404);
        expect(response.body.message)
            .toBe("Route introuvable");
    });

    it("refuse l'acces a /api/auth/me sans token", async () => {
        const response = await request(app)
            .get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.message)
            .toBe("Authentification requise");
    });

});
