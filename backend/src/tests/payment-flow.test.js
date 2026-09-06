require("dotenv").config();

const {
    createPayment,
    getPendingPayments,
    confirmOnSitePayment
} = require("../controllers/paymentController");

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

describe("Contrat du flux de paiement", () => {
    it.each([
        ["card", "CARD", "STRIPE"],
        ["paypal", "PAYPAL", "PAYPAL"],
        ["mobile_money", "MOBILE_MONEY", "MOBILE_MONEY"],
        ["on_site", "ON_SITE", "MANUAL"]
    ])(
        "mappe %s vers payment_method=%s et provider=%s",
        async (_label, paymentMethod, expectedProvider) => {
            const response = createResponse();
            const calls = [];
            const supabase = {
                rpc(name, payload) {
                    calls.push([name, payload]);
                    return Promise.resolve({
                        data: {
                            id: 10,
                            payment_method: paymentMethod,
                            provider: expectedProvider,
                            status: "PENDING"
                        },
                        error: null
                    });
                }
            };

            await createPayment({
                body: { reservationId: 7, paymentMethod: paymentMethod.toLowerCase() },
                supabase
            }, response);

            expect(calls).toEqual([
                [
                    "create_payment_for_reservation",
                    {
                        p_reservation_id: 7,
                        p_payment_method: paymentMethod
                    }
                ]
            ]);
            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual({
                message: "Paiement cree avec succes",
                payment: {
                    id: 10,
                    payment_method: paymentMethod,
                    provider: expectedProvider,
                    status: "PENDING"
                }
            });
        }
    );

    it("garde le filtre sur les paiements ON_SITE en attente", async () => {
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

        await getPendingPayments({ supabase }, response);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ payments: [] });
        expect(calls).toEqual([
            ["from", "payments"],
            ["select", "*"],
            ["eq", "status", "PENDING"],
            ["eq", "payment_method", "ON_SITE"],
            ["order", "created_at", { ascending: true }]
        ]);
    });

    it("confirme un paiement ON_SITE via la RPC dediee", async () => {
        const response = createResponse();
        const calls = [];
        const supabase = {
            rpc(name, payload) {
                calls.push([name, payload]);
                return Promise.resolve({
                    data: { id: 3, status: "SUCCEEDED" },
                    error: null
                });
            }
        };

        await confirmOnSitePayment({
            params: { paymentId: "3" },
            supabase
        }, response);

        expect(calls).toEqual([
            [
                "confirm_on_site_payment",
                {
                    p_payment_id: 3
                }
            ]
        ]);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            message: "Paiement sur place confirme",
            payment: { id: 3, status: "SUCCEEDED" }
        });
    });
});
