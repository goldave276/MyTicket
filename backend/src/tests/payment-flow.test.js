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

    describe("Passerelle de paiement en ligne (Phase B3)", () => {
        const {
            validateTogoPhoneNumber,
            initiateStripeCheckout,
            initiateMobileMoneyPayment
        } = require("../services/paymentService");
        const {
            initiateCheckout,
            handleStripeWebhook,
            handleMobileMoneyWebhook
        } = require("../controllers/paymentController");

        it("valide les numeros de telephone Flooz et T-Money Togo", () => {
            expect(validateTogoPhoneNumber("90 12 34 56")).toEqual({
                isValid: true,
                cleanNumber: "90123456",
                network: "FLOOZ"
            });
            expect(validateTogoPhoneNumber("+228 70 99 88 77")).toEqual({
                isValid: true,
                cleanNumber: "70998877",
                network: "TMONEY"
            });
            expect(validateTogoPhoneNumber("01234567").isValid).toBe(false);
            expect(validateTogoPhoneNumber("short").isValid).toBe(false);
        });

        it("initialise un checkout Stripe (simulation ou reel)", async () => {
            const result = await initiateStripeCheckout({
                payment: { id: 42, amount: 5000, currency: "XOF" },
                reservation: { id: 10, quantity: 2 },
                event: { title: "Concert", price: 2500 },
                frontendUrl: "http://localhost:3333"
            });

            expect(result.checkoutUrl).toBeDefined();
            expect(result.providerPaymentId).toBeDefined();
        });

        it("initialise un paiement Mobile Money Togo avec instructions", async () => {
            const result = await initiateMobileMoneyPayment({
                payment: { id: 50, amount: 10000, currency: "XOF" },
                reservation: { id: 12, quantity: 1 },
                event: { title: "Festival", price: 10000 },
                phoneNumber: "+228 92 11 22 33"
            });

            expect(result.network).toBe("FLOOZ");
            expect(result.amount).toBe(10000);
            expect(result.instructions).toContain("92112233");
        });

        it("confirme un paiement en ligne via handleStripeWebhook", async () => {
            const response = createResponse();
            const calls = [];
            const supabase = {
                rpc(name, payload) {
                    calls.push([name, payload]);
                    return Promise.resolve({
                        data: { id: 42, status: "SUCCEEDED" },
                        error: null
                    });
                }
            };

            await handleStripeWebhook({
                body: { paymentId: 42, providerPaymentId: "cs_test_123", status: "SUCCEEDED" },
                supabase
            }, response);

            expect(calls[0][0]).toBe("confirm_online_payment");
            expect(calls[0][1].p_payment_id).toBe(42);
            expect(response.statusCode).toBe(200);
            expect(response.body.payment.status).toBe("SUCCEEDED");
        });

        it("confirme un paiement Mobile Money via handleMobileMoneyWebhook", async () => {
            const response = createResponse();
            const calls = [];
            const supabase = {
                rpc(name, payload) {
                    calls.push([name, payload]);
                    return Promise.resolve({
                        data: { id: 55, status: "SUCCEEDED" },
                        error: null
                    });
                }
            };

            await handleMobileMoneyWebhook({
                body: { paymentId: 55, transactionRef: "MM_TG_90112233", status: "SUCCESS" },
                supabase
            }, response);

            expect(calls[0][0]).toBe("confirm_online_payment");
            expect(calls[0][1].p_payment_id).toBe(55);
            expect(response.statusCode).toBe(200);
            expect(response.body.payment.status).toBe("SUCCEEDED");
        });
    });
});

