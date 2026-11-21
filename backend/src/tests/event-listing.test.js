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

describe("Liste publique des evenements", () => {
    it("demande uniquement les evenements approuves et futurs", async () => {
        const response = createResponse();
        const calls = [];
        const query = {
            select(fields) {
                calls.push(["select", fields]);
                return this;
            },
            eq(field, value) {
                calls.push(["eq", field, value]);
                return this;
            },
            gte(field, value) {
                calls.push(["gte", field, value]);
                return this;
            },
            order(field, options) {
                calls.push(["order", field, options]);
                return this;
            },
            range(start, end) {
                calls.push(["range", start, end]);
                return Promise.resolve({ data: [], error: null });
            }
        };
        const supabase = {
            from(table) {
                calls.push(["from", table]);
                return query;
            }
        };

        require("../config/supabase");
        const supabaseModule = require.cache[require.resolve("../config/supabase")];
        const originalSupabase = supabaseModule.exports.supabase;
        supabaseModule.exports.supabase = supabase;

        try {
            const { getApprovedEvents } = require("../controllers/eventController");
            await getApprovedEvents({}, response);
        } finally {
            supabaseModule.exports.supabase = originalSupabase;
        }

        expect(response.statusCode).toBe(200);
        expect(response.body.events).toEqual([]);
        expect(calls.some((call) => call[0] === "eq" && call[1] === "status" && call[2] === "APPROVED"))
            .toBe(true);
        expect(calls.some((call) => call[0] === "gte" && call[1] === "event_date"))
            .toBe(true);
    });

    it("calcule remainingCapacity dans le catalogue public via get_events_booked_counts", async () => {
        const response = createResponse();
        const rpcCalls = [];
        const query = {
            select() { return this; },
            eq() { return this; },
            gte() { return this; },
            order() { return this; },
            range() {
                return Promise.resolve({
                    data: [
                        { id: 5, title: "amapiano", capacity: 100, price: 0 },
                        { id: 6, title: "techconf", capacity: 50, price: 5000 }
                    ],
                    count: 2,
                    error: null
                });
            }
        };
        const supabase = {
            from() { return query; },
            rpc(name, payload) {
                rpcCalls.push([name, payload]);
                return Promise.resolve({
                    data: [{ event_id: 5, booked_seats: 1 }],
                    error: null
                });
            }
        };

        const supabaseModule = require.cache[require.resolve("../config/supabase")];
        const originalSupabase = supabaseModule.exports.supabase;
        supabaseModule.exports.supabase = supabase;

        try {
            delete require.cache[require.resolve("../controllers/eventController")];
            const { getApprovedEvents } = require("../controllers/eventController");
            await getApprovedEvents({ query: {} }, response);
        } finally {
            supabaseModule.exports.supabase = originalSupabase;
            delete require.cache[require.resolve("../controllers/eventController")];
        }

        expect(rpcCalls).toEqual([["get_events_booked_counts", { p_event_ids: [5, 6] }]]);
        expect(response.statusCode).toBe(200);
        expect(response.body.events[0]).toMatchObject({
            id: 5,
            capacity: 100,
            bookedSeats: 1,
            remainingCapacity: 99,
            remaining_capacity: 99
        });
        expect(response.body.events[1]).toMatchObject({
            id: 6,
            capacity: 50,
            bookedSeats: 0,
            remainingCapacity: 50
        });
    });

    it("bascule sur le comptage reservations si get_events_booked_counts echoue", async () => {
        const response = createResponse();
        const eventsQuery = {
            select() { return this; },
            eq() { return this; },
            gte() { return this; },
            order() { return this; },
            range() {
                return Promise.resolve({
                    data: [{ id: 5, title: "amapiano", capacity: 100, price: 0 }],
                    count: 1,
                    error: null
                });
            }
        };
        const reservationsQuery = {
            select() { return this; },
            eq() { return this; },
            in() {
                return Promise.resolve({
                    data: [{ event_id: 5, quantity: 3 }],
                    error: null
                });
            }
        };
        const supabase = {
            from(table) {
                return table === "reservations" ? reservationsQuery : eventsQuery;
            },
            rpc() {
                return Promise.resolve({ data: null, error: { message: "PGRST202" } });
            }
        };

        const supabaseModule = require.cache[require.resolve("../config/supabase")];
        const originalSupabase = supabaseModule.exports.supabase;
        supabaseModule.exports.supabase = supabase;

        try {
            delete require.cache[require.resolve("../controllers/eventController")];
            const { getApprovedEvents } = require("../controllers/eventController");
            await getApprovedEvents({ query: {} }, response);
        } finally {
            supabaseModule.exports.supabase = originalSupabase;
            delete require.cache[require.resolve("../controllers/eventController")];
        }

        expect(response.statusCode).toBe(200);
        expect(response.body.events[0].remainingCapacity).toBe(97);
    });

    it("enrichit getMyEvents avec remainingCapacity pour l'espace organisateur", async () => {
        const response = createResponse();
        const reqSupabase = {
            from() {
                return {
                    select() { return this; },
                    eq() { return this; },
                    order() {
                        return Promise.resolve({
                            data: [{ id: 5, title: "amapiano", capacity: 100, status: "APPROVED" }],
                            error: null
                        });
                    }
                };
            }
        };

        const supabaseModule = require.cache[require.resolve("../config/supabase")];
        const originalSupabase = supabaseModule.exports.supabase;
        supabaseModule.exports.supabase = {
            rpc: () => Promise.resolve({ data: [{ event_id: 5, booked_seats: 4 }], error: null })
        };

        try {
            delete require.cache[require.resolve("../controllers/eventController")];
            const { getMyEvents } = require("../controllers/eventController");
            await getMyEvents({ user: { id: "org-1" }, supabase: reqSupabase }, response);
        } finally {
            supabaseModule.exports.supabase = originalSupabase;
            delete require.cache[require.resolve("../controllers/eventController")];
        }

        expect(response.statusCode).toBe(200);
        expect(response.body.events[0]).toMatchObject({
            id: 5,
            capacity: 100,
            bookedSeats: 4,
            remainingCapacity: 96
        });
    });
});
