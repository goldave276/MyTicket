require("dotenv").config();

const request = require("supertest");
const app = require("../App");

describe("Protection des routes metier", () => {
    it.each([
        ["POST", "/api/events"],
        ["GET", "/api/events/me"],
        ["POST", "/api/reservations"],
        ["GET", "/api/reservations/me"],
        ["GET", "/api/tickets/me"],
        ["POST", "/api/payments"],
        ["GET", "/api/payments/me"],
        ["GET", "/api/admin/events/pending"],
        ["GET", "/api/admin/organizer-requests"]
    ])("refuse %s %s sans token", async (method, path) => {
        const response = await request(app)[method.toLowerCase()](path);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentification requise");
    });
});
