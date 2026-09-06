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
});
