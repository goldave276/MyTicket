require("dotenv").config();

const { login } = require("../controllers/authController");
const {
    createOrganizerRequest,
    rejectOrganizerRequest
} = require("../controllers/organizerRequestController");
const { createPayment } = require("../controllers/paymentController");
const {
    cancelReservation
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

describe("Validation des entrees des controllers", () => {
    it("refuse une connexion sans email ou mot de passe", async () => {
        const response = createResponse();

        await login({ body: { email: "" } }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "Email et mot de passe obligatoires"
        );
    });

    it("refuse une demande organisateur incomplete", async () => {
        const response = createResponse();
        const supabase = {
            from: () => {
                throw new Error("La base ne doit pas etre appelee");
            }
        };

        await createOrganizerRequest({
            body: { eventType: "   ", documentPath: "   " },
            user: { id: "user-id" },
            supabase
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "Le type d'evenement et le document sont obligatoires"
        );
    });

    it("refuse un mode de paiement inconnu", async () => {
        const response = createResponse();
        const supabase = {
            rpc: () => {
                throw new Error("La base ne doit pas etre appelee");
            }
        };

        await createPayment({
            body: { reservationId: 1, paymentMethod: "CHEQUE" },
            supabase
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Mode de paiement invalide");
    });

    it("refuse un commentaire admin trop long", async () => {
        const response = createResponse();

        await rejectOrganizerRequest({
            params: { requestId: 1 },
            body: { adminComment: "x".repeat(1001) },
            supabase: {}
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Le commentaire admin est invalide");
    });

    it("refuse un identifiant de reservation invalide pour l'annulation", async () => {
        const response = createResponse();
        const supabase = {
            rpc: () => {
                throw new Error("La base ne doit pas etre appelee");
            }
        };

        await cancelReservation({
            params: { reservationId: "abc" },
            supabase
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "Identifiant de reservation invalide"
        );
    });
});
