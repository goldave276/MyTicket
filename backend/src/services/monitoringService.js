const Sentry = require("@sentry/node");
const { sendCriticalAlertEmail } = require("./emailService");

const ALERT_COOLDOWN_MS = 5 * 60 * 1000;
const lastAlertByContext = new Map();

function sanitizeHeaders(headers) {
    if (!headers || typeof headers !== "object") return headers;
    const scrubbed = { ...headers };
    for (const key of ["authorization", "cookie", "stripe-signature", "x-webhook-secret"]) {
        if (scrubbed[key]) {
            scrubbed[key] = "[REDACTED]";
        }
    }
    return scrubbed;
}

/**
 * Initialise Sentry cote backend uniquement si SENTRY_DSN est configure.
 */
function initMonitoring() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn || typeof dsn !== "string" || !dsn.trim()) {
        return false;
    }

    if (Sentry.isInitialized()) {
        return true;
    }

    Sentry.init({
        dsn: dsn.trim(),
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
        beforeSend(event) {
            if (event.request?.headers) {
                event.request.headers = sanitizeHeaders(event.request.headers);
            }
            return event;
        }
    });

    return true;
}

function shouldThrottleAlert(context, now = Date.now()) {
    const key = context || "DEFAULT";
    const previous = lastAlertByContext.get(key) || 0;
    if (now - previous < ALERT_COOLDOWN_MS) {
        return true;
    }
    lastAlertByContext.set(key, now);
    return false;
}

/**
 * Journalise une erreur critique en JSON structure, la remonte vers Sentry si actif,
 * et declenche une alerte email admin throttlee (sans impact bloquant sur la requete).
 */
function reportCriticalError({ context, error, metadata = {}, forceEmail = false }) {
    const errObj = error instanceof Error ? error : new Error(String(error || "Unknown critical error"));

    console.error(
        JSON.stringify({
            level: "critical",
            timestamp: new Date().toISOString(),
            context: context || "SYSTEM",
            message: errObj.message,
            metadata
        })
    );

    if (Sentry.isInitialized()) {
        Sentry.captureException(errObj, {
            tags: { context: context || "SYSTEM" },
            extra: metadata
        });
    }

    const canSendEmail = forceEmail || process.env.NODE_ENV !== "test";
    if (canSendEmail && !shouldThrottleAlert(context)) {
        Promise.resolve(
            sendCriticalAlertEmail({
                context,
                message: errObj.message,
                stack: errObj.stack,
                metadata
            })
        ).catch((mailErr) => {
            console.error("[monitoringService] Echec alerte email:", mailErr.message);
        });
    }
}

function resetAlertCooldownForTests() {
    lastAlertByContext.clear();
}

module.exports = {
    initMonitoring,
    reportCriticalError,
    sanitizeHeaders,
    resetAlertCooldownForTests
};
