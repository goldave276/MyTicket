require("dotenv").config();

const { createReservation } = require("../controllers/reservationController");

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

describe("Validation de creation de reservation", () => {
    it.each([
        [{ eventId: "abc", quantity: 1 }],
        [{ eventId: 1, quantity: 0 }],
        [{ eventId: 1, quantity: 1.5 }],
        [{ eventId: 1, quantity: -2 }]
    ])("refuse les donnees invalides: %o", async (body) => {
        const response = createResponse();
        const supabase = {
            rpc: () => {
                throw new Error("La base ne doit pas etre appelee");
            }
        };

        await createReservation({ body, supabase }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Evenement ou quantite invalide");
    });
});
