require("dotenv").config();

const request = require("supertest");
const app = require("../App");

describe("Protection des routes metier", () => {
    it.each([
        ["POST", "/api/events"],
        ["GET", "/api/events/me"],
        ["GET", "/api/events/stats"],
        ["POST", "/api/reservations"],
        ["GET", "/api/reservations/me"],
        ["GET", "/api/tickets/me"],
        ["POST", "/api/payments"],
        ["GET", "/api/payments/me"],
        ["GET", "/api/admin/events/pending"],
        ["GET", "/api/admin/stats"],
        ["GET", "/api/admin/organizer-requests"]
    ])("refuse %s %s sans token", async (method, path) => {
        const response = await request(app)[method.toLowerCase()](path);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentification requise");
    });

    it("limite les tentatives de connexion", async () => {
        const responses = [];

        for (let attempt = 0; attempt < 11; attempt += 1) {
            responses.push(
                await request(app)
                    .post("/api/auth/login")
                    .send({})
            );
        }

        expect(responses.slice(0, 10).every((response) => response.status === 400))
            .toBe(true);
        expect(responses[10].status).toBe(429);
        expect(responses[10].body.message).toContain("Trop de tentatives");
    });
});
