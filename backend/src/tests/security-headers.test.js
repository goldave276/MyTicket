require("dotenv").config();

const request = require("supertest");
const app = require("../App");

describe("Tests de securite des en-tetes HTTP et CORS", () => {
    it("inclut les en-tetes de securite Helmet de base", async () => {
        const response = await request(app).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
        expect(response.headers["x-xss-protection"]).toBeDefined();
    });

    it("accepte les requetes avec une origine autorisee", async () => {
        const response = await request(app)
            .get("/api/health")
            .set("Origin", "http://localhost:3001");

        expect(response.status).toBe(200);
        expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3001");
    });
});
