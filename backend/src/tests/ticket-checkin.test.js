require("dotenv").config();

const { scanTicket, getEventCheckinSummary } = require("../controllers/ticketController");

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

describe("Contrôle d'accès & Scanner de billets (Phase B1.3)", () => {
    it("refuse un code de billet qui n'est pas un UUID valide", async () => {
        const response = createResponse();

        await scanTicket({
            body: { ticketCode: "code-invalide-non-uuid", eventId: 10 }
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("UUID attendu");
    });

    it("refuse un identifiant d'événement négatif ou manquant", async () => {
        const response = createResponse();

        await scanTicket({
            body: { ticketCode: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", eventId: 0 }
        }, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("Identifiant d'evenement invalide");
    });

    it("valide avec succès un billet actif et retourne les infos du participant", async () => {
        const response = createResponse();
        const calls = [];
        const validCode = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

        const supabase = {
            rpc(name, payload) {
                calls.push([name, payload]);
                return Promise.resolve({
                    data: {
                        ticket_id: 15,
                        ticket_code: validCode,
                        status: "USED",
                        scanned_at: "2026-10-25T20:00:00Z",
                        participant_name: "Koffi Mensah",
                        participant_email: "koffi@example.com"
                    },
                    error: null
                });
            }
        };

        await scanTicket({
            body: { ticketCode: validCode, eventId: 7 },
            supabase
        }, response);

        expect(calls[0][0]).toBe("scan_and_checkin_ticket");
        expect(calls[0][1]).toEqual({
            p_ticket_code: validCode,
            p_event_id: 7
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toContain("Entree validee");
        expect(response.body.checkin.participant_name).toBe("Koffi Mensah");
    });

    it("détecte et bloque un billet déjà scanné (409 Conflict)", async () => {
        const response = createResponse();
        const validCode = "b1ffcd88-8b0a-4fe7-aa5c-5aa8ac270b22";

        const supabase = {
            rpc() {
                return Promise.resolve({
                    data: null,
                    error: { message: "Billet deja utilise le 25/10/2026 a 19:30:00 UTC" }
                });
            }
        };

        await scanTicket({
            body: { ticketCode: validCode, eventId: 7 },
            supabase
        }, response);

        expect(response.statusCode).toBe(409);
        expect(response.body.alreadyScanned).toBe(true);
        expect(response.body.message).toContain("Billet deja utilise");
    });

    it("calcule les statistiques d'entrées d'un événement", async () => {
        const response = createResponse();
        const supabase = {
            from() {
                return {
                    select() {
                        return {
                            eq() {
                                return Promise.resolve({
                                    data: [
                                        { id: 1, status: "USED", scanned_at: "2026-10-25" },
                                        { id: 2, status: "USED", scanned_at: "2026-10-25" },
                                        { id: 3, status: "ACTIVE", scanned_at: null },
                                        { id: 4, status: "ACTIVE", scanned_at: null }
                                    ],
                                    error: null
                                });
                            }
                        };
                    }
                };
            }
        };

        await getEventCheckinSummary({
            params: { eventId: "12" },
            supabase
        }, response);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            eventId: 12,
            totalTickets: 4,
            scannedTickets: 2,
            remainingTickets: 2,
            attendanceRate: 50
        });
    });
});
