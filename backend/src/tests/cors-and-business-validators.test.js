require("dotenv").config();

const request = require("supertest");
const app = require("../app");
const { validateEventInput, validateEventId } = require("../validators/eventValidator");
const {
    validateReservationInput,
    validatePaymentInput,
    validateReservationId
} = require("../validators/reservationValidator");

describe("Securite CORS et en-tetes HTTP (Action A5)", () => {
    it("autorise les requetes provenant d'une origine declaree dans FRONTEND_URL", async () => {
        const response = await request(app)
            .get("/api/health")
            .set("Origin", "http://localhost:3001");

        expect(response.statusCode).toBe(200);
        expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3001");
        expect(response.headers["vary"]).toContain("Origin");
    });

    it("autorise les pre-vols OPTIONS avec les en-tetes autorises", async () => {
        const response = await request(app)
            .options("/api/health")
            .set("Origin", "http://localhost:3001")
            .set("Access-Control-Request-Method", "GET");

        expect([200, 204]).toContain(response.statusCode);
        expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3001");
    });

    it("rejette avec 403 toute requete provenant d'une origine non declaree", async () => {
        const response = await request(app)
            .get("/api/health")
            .set("Origin", "https://unauthorized-attacker-site.com");

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe("Origine non autorisee");
    });

    it("autorise les requetes sans en-tête Origin (outils serveurs, curl, healthchecks)", async () => {
        const response = await request(app)
            .get("/api/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("API MyTicket operationnelle");
    });
});

describe("Validations Metier des Evenements (Action A6 - eventValidator)", () => {
    const validEvent = {
        title: "Concert de Gala 2027",
        description: "Un concert exceptionnel pour celebrer la musique live.",
        eventType: "CONCERT",
        eventDate: "2027-12-31T20:00:00.000Z",
        location: "Lome, Palais des Congres",
        capacity: 500,
        price: 5000
    };

    it("valide un payload d'evenement complet et conforme", () => {
        const result = validateEventInput(validEvent);
        expect(result.isValid).toBe(true);
        expect(result.value.title).toBe(validEvent.title);
        expect(result.value.capacity).toBe(500);
        expect(result.value.price).toBe(5000);
    });

    it("refuse un titre inferieur a 3 caracteres ou superieur a 150 caracteres", () => {
        const shortTitle = { ...validEvent, title: "Ab" };
        expect(validateEventInput(shortTitle).isValid).toBe(false);

        const longTitle = { ...validEvent, title: "A".repeat(151) };
        expect(validateEventInput(longTitle).isValid).toBe(false);
    });

    it("refuse une description inferieure a 10 caracteres ou superieure a 5000 caracteres", () => {
        const shortDesc = { ...validEvent, description: "Court" };
        expect(validateEventInput(shortDesc).isValid).toBe(false);

        const longDesc = { ...validEvent, description: "A".repeat(5001) };
        expect(validateEventInput(longDesc).isValid).toBe(false);
    });

    it("refuse une date passee ou invalide", () => {
        const pastDate = { ...validEvent, eventDate: "2020-01-01T00:00:00.000Z" };
        expect(validateEventInput(pastDate).isValid).toBe(false);

        const invalidDate = { ...validEvent, eventDate: "not-a-date" };
        expect(validateEventInput(invalidDate).isValid).toBe(false);
    });

    it("refuse une capacite negative, nulle, decimale ou superieure a 100 000", () => {
        expect(validateEventInput({ ...validEvent, capacity: 0 }).isValid).toBe(false);
        expect(validateEventInput({ ...validEvent, capacity: -10 }).isValid).toBe(false);
        expect(validateEventInput({ ...validEvent, capacity: 12.5 }).isValid).toBe(false);
        expect(validateEventInput({ ...validEvent, capacity: 100001 }).isValid).toBe(false);
    });

    it("refuse un prix negatif", () => {
        expect(validateEventInput({ ...validEvent, price: -1 }).isValid).toBe(false);
    });

    it("valide les identifiants d'evenement stricts", () => {
        expect(validateEventId(1).isValid).toBe(true);
        expect(validateEventId("42").isValid).toBe(true);
        expect(validateEventId(0).isValid).toBe(false);
        expect(validateEventId(-5).isValid).toBe(false);
        expect(validateEventId("abc").isValid).toBe(false);
        expect(validateEventId(1.5).isValid).toBe(false);
    });
});

describe("Validations Metier des Reservations & Paiements (Action A6 - reservationValidator)", () => {
    it("valide une creation de reservation avec quantite entre 1 et 100", () => {
        const validRes = {
            eventId: 10,
            quantity: 2,
            paymentMethod: "ON_SITE"
        };
        const result = validateReservationInput(validRes);
        expect(result.isValid).toBe(true);
        expect(result.value.quantity).toBe(2);
    });

    it("refuse une quantite nulle, negative ou superieure a 100", () => {
        expect(validateReservationInput({ eventId: 1, quantity: 0, paymentMethod: "ON_SITE" }).isValid).toBe(false);
        expect(validateReservationInput({ eventId: 1, quantity: -5, paymentMethod: "ON_SITE" }).isValid).toBe(false);
        expect(validateReservationInput({ eventId: 1, quantity: 101, paymentMethod: "ON_SITE" }).isValid).toBe(false);
    });

    it("refuse un mode de paiement non autorise", () => {
        expect(validateReservationInput({ eventId: 1, quantity: 1, paymentMethod: "BITCOIN" }).isValid).toBe(false);
        expect(validatePaymentInput({ reservationId: 1, paymentMethod: "CHEQUE" }).isValid).toBe(false);
    });

    it("valide les identifiants de reservation et paiement", () => {
        expect(validateReservationId(5).isValid).toBe(true);
        expect(validateReservationId("123").isValid).toBe(true);
        expect(validateReservationId("invalid").isValid).toBe(false);
        expect(validateReservationId(0).isValid).toBe(false);
    });
});
