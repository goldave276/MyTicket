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

    it("expose participant_name et participant_email sous les champs attendus par le frontend", async () => {
        const response = createResponse();
        const supabase = {
            rpc(name, payload) {
                expect(name).toBe("get_organizer_event_reservations");
                expect(payload).toEqual({ p_event_id: 5 });
                return Promise.resolve({
                    data: [
                        {
                            id: 12,
                            event_id: 5,
                            user_id: "user-abc",
                            quantity: 2,
                            status: "CONFIRMED",
                            created_at: "2026-11-21T10:00:00.000Z",
                            participant_name: "Dave Kodjo",
                            participant_email: "dave@example.com"
                        }
                    ],
                    error: null
                });
            }
        };

        await getEventReservations({
            params: { eventId: "5" },
            supabase
        }, response);

        expect(response.statusCode).toBe(200);
        expect(response.body.reservations).toHaveLength(1);
        expect(response.body.reservations[0]).toMatchObject({
            id: 12,
            userName: "Dave Kodjo",
            userEmail: "dave@example.com",
            user: {
                fullName: "Dave Kodjo",
                email: "dave@example.com"
            }
        });
    });
});
