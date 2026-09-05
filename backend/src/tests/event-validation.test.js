require("dotenv").config();

const {
    createEvent,
    cancelEvent
} = require("../controllers/eventController");

function createResponse() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

describe("Validation de creation d'evenement", () => {
    it("refuse un titre vide", async () => {
        const response = createResponse();
        const supabase = {
            from: () => {
                throw new Error("La base ne doit pas etre appelee");
            }
        };

        await createEvent({
            body: {
                title: "   ",
                description: "Description",
                eventType: "Conference",
                eventDate: "2027-06-15T18:00:00.000Z",
                location: "Paris",
                capacity: 100,
                price: 25
            },
            user: { id: "user-id" },
            supabase
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "Les informations obligatoires sont manquantes"
        );
    });

    it("refuse une capacite decimale ou negative", async () => {
        const response = createResponse();

        await createEvent({
            body: {
                title: "Conference",
                description: "Description",
                eventType: "Conference",
                eventDate: "2027-06-15T18:00:00.000Z",
                location: "Paris",
                capacity: 10.5,
                price: 25
            },
            user: { id: "user-id" },
            supabase: {}
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "La capacite doit etre un entier positif"
        );
    });

    it("refuse l'annulation avec un identifiant invalide", async () => {
        const response = createResponse();

        await cancelEvent({
            params: { eventId: "abc" },
            supabase: {}
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "Identifiant d'evenement invalide"
        );
    });
});
