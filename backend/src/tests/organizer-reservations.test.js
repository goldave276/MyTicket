require("dotenv").config();

const {
    getEventReservations
} = require("../controllers/reservationController");

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

describe("Reservations cote organisateur", () => {
    it("refuse un identifiant d'evenement invalide", async () => {
        const response = createResponse();

        await getEventReservations({
            params: { eventId: "abc" },
            supabase: {}
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "Identifiant d'evenement invalide"
        );
    });
});
