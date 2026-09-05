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
});
