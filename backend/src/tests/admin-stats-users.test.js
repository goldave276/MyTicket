require("dotenv").config();

const request = require("supertest");
const app = require("../App");

describe("Endpoints Stats et Admin Users", () => {
    it("refuse l'acces a GET /api/events/stats sans authentification", async () => {
        const response = await request(app).get("/api/events/stats");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentification requise");
    });

    it("refuse l'acces a GET /api/admin/stats sans authentification", async () => {
        const response = await request(app).get("/api/admin/stats");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentification requise");
    });

    it("refuse l'acces a GET /api/admin/users sans authentification", async () => {
        const response = await request(app).get("/api/admin/users");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentification requise");
    });

    it("refuse la modification de role sans authentification", async () => {
        const response = await request(app)
            .patch("/api/admin/users/123e4567-e89b-12d3-a456-426614174000/role")
            .send({ role: "ORGANIZER" });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentification requise");
    });

    it("refuse le blocage d'un utilisateur sans authentification", async () => {
        const response = await request(app)
            .patch("/api/admin/users/123e4567-e89b-12d3-a456-426614174000/block")
            .send({ isBlocked: true });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentification requise");
    });
});
