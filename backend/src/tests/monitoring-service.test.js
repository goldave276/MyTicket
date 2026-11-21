const {
    initMonitoring,
    reportCriticalError,
    sanitizeHeaders,
    resetAlertCooldownForTests
} = require("../services/monitoringService");

describe("Service de monitoring et d'alerting (Sentry + Alertes critiques)", () => {
    const originalDsn = process.env.SENTRY_DSN;

    afterEach(() => {
        if (originalDsn === undefined) {
            delete process.env.SENTRY_DSN;
        } else {
            process.env.SENTRY_DSN = originalDsn;
        }
        resetAlertCooldownForTests();
        vi.restoreAllMocks();
    });

    it("n'initialise pas Sentry lorsque SENTRY_DSN est absent ou vide", () => {
        delete process.env.SENTRY_DSN;
        expect(initMonitoring()).toBe(false);

        process.env.SENTRY_DSN = "   ";
        expect(initMonitoring()).toBe(false);
    });

    it("masque les en-tetes sensibles avant envoi a Sentry", () => {
        const cleaned = sanitizeHeaders({
            authorization: "Bearer secret.jwt.token",
            cookie: "session=abc",
            "stripe-signature": "t=123,v1=sig",
            "x-webhook-secret": "momo_secret",
            "content-type": "application/json"
        });

        expect(cleaned.authorization).toBe("[REDACTED]");
        expect(cleaned.cookie).toBe("[REDACTED]");
        expect(cleaned["stripe-signature"]).toBe("[REDACTED]");
        expect(cleaned["x-webhook-secret"]).toBe("[REDACTED]");
        expect(cleaned["content-type"]).toBe("application/json");
    });

    it("journalise en JSON structure lors d'une erreur critique et applique le throttling", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        reportCriticalError({
            context: "STRIPE_WEBHOOK_FAILURE",
            error: new Error("Signature invalide"),
            metadata: { paymentId: 99 }
        });

        expect(errorSpy).toHaveBeenCalledTimes(1);
        const logged = JSON.parse(errorSpy.mock.calls[0][0]);
        expect(logged.level).toBe("critical");
        expect(logged.context).toBe("STRIPE_WEBHOOK_FAILURE");
        expect(logged.message).toBe("Signature invalide");
        expect(logged.metadata.paymentId).toBe(99);
    });
});
