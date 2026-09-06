require("dotenv").config();

const request = require("supertest");
const app = require("../App");

describe("Tests de durcissement d'authentification (Phase B0.2)", () => {
    describe("Validation Zod", () => {
        it("refuse une connexion avec un format d'email invalide", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({ email: "invalid-email-format", password: "password123" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Donnees de connexion invalides");
            expect(response.body.errors.email).toBeDefined();
        });

        it("refuse une inscription avec un mot de passe trop court (< 6 caracteres)", async () => {
            const response = await request(app)
                .post("/api/auth/signup")
                .send({ email: "valid.user@example.com", password: "123" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Donnees d'inscription invalides");
            expect(response.body.errors.password).toBeDefined();
        });

        it("refuse une demande de reinitialisation avec un email malforme", async () => {
            const response = await request(app)
                .post("/api/auth/password-reset")
                .send({ email: "notanemail" });

            expect(response.status).toBe(400);
            expect(response.body.errors.email).toBeDefined();
        });
    });

    describe("Limiteurs de debit (Rate Limiting)", () => {
        it("limite les tentatives d'inscription excessives", async () => {
            const responses = [];
            for (let i = 0; i < 6; i++) {
                responses.push(
                    await request(app)
                        .post("/api/auth/signup")
                        .send({ email: "bad" })
                );
            }

            expect(responses[5].status).toBe(429);
            expect(responses[5].body.message).toContain("Trop de tentatives d'inscription");
        });

        it("limite les demandes de reinitialisation excessives", async () => {
            const responses = [];
            for (let i = 0; i < 6; i++) {
                responses.push(
                    await request(app)
                        .post("/api/auth/password-reset")
                        .send({ email: "bad" })
                );
            }

            expect(responses[5].status).toBe(429);
            expect(responses[5].body.message).toContain("Trop de demandes de reinitialisation");
        });
    });
});
