require("dotenv").config();

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

describe("Detail public d'evenement", () => {
    const supabaseModule = require("../config/supabase");
    const originalSupabase = supabaseModule.supabase;

    afterEach(() => {
        supabaseModule.supabase = originalSupabase;
        delete require.cache[require.resolve("../controllers/eventController")];
    });

    it("retourne le detail public et la disponibilite provenant de la RPC", async () => {
        const calls = [];
        supabaseModule.supabase = {
            rpc(name, payload) {
                calls.push([name, payload]);
                return Promise.resolve({
                    data: { id: 7, remainingCapacity: 12 },
                    error: null
                });
            }
        };

        delete require.cache[require.resolve("../controllers/eventController")];
        const { getPublicEventDetail } = require("../controllers/eventController");
        const response = createResponse();

        await getPublicEventDetail({ params: { eventId: "7" } }, response);

        expect(calls).toEqual([["get_public_event_detail", { p_event_id: 7 }]]);
        expect(response.statusCode).toBe(200);
        expect(response.body.event.remainingCapacity).toBe(12);
    });

    it("ne divulgue pas un evenement absent ou non public", async () => {
        supabaseModule.supabase = {
            rpc: () => Promise.resolve({ data: null, error: null })
        };

        delete require.cache[require.resolve("../controllers/eventController")];
        const { getPublicEventDetail } = require("../controllers/eventController");
        const response = createResponse();

        await getPublicEventDetail({ params: { eventId: "7" } }, response);

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Evenement introuvable");
    });

    it("bascule sur le fallback direct de la table events si la RPC echoue", async () => {
        supabaseModule.supabase = {
            rpc: () => Promise.resolve({ data: null, error: { message: "function does not exist" } }),
            from(table) {
                if (table === "events") {
                    return {
                        select() { return this; },
                        eq() { return this; },
                        gt() { return this; },
                        maybeSingle() {
                            return Promise.resolve({
                                data: {
                                    id: 7,
                                    title: "Concert de Gala",
                                    description: "Soiree musicale",
                                    event_type: "CONCERT",
                                    event_date: "2026-12-31T20:00:00.000Z",
                                    location: "Palais des Congres",
                                    capacity: 200,
                                    price: 5000,
                                    status: "APPROVED",
                                    organizer_id: "user-123"
                                },
                                error: null
                            });
                        }
                    };
                }
                if (table === "reservations") {
                    return {
                        select() { return this; },
                        eq() { return this; },
                        in() {
                            return Promise.resolve({
                                data: [{ quantity: 15 }, { quantity: 5 }],
                                error: null
                            });
                        }
                    };
                }
                return {};
            }
        };

        delete require.cache[require.resolve("../controllers/eventController")];
        const { getPublicEventDetail } = require("../controllers/eventController");
        const response = createResponse();

        await getPublicEventDetail({ params: { eventId: "7" } }, response);

        expect(response.statusCode).toBe(200);
        expect(response.body.event.id).toBe(7);
        expect(response.body.event.title).toBe("Concert de Gala");
        expect(response.body.event.capacity).toBe(200);
        expect(response.body.event.remainingCapacity).toBe(180); // 200 - (15 + 5)
    });
});
