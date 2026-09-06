const { z } = require("zod");

const ALLOWED_PAYMENT_METHODS = ["ON_SITE"];

const createReservationSchema = z.object({
    eventId: z
        .union([z.string(), z.number()], { required_error: "L'identifiant d'evenement est obligatoire" })
        .transform((val) => Number(val))
        .refine((val) => Number.isInteger(val) && val > 0, {
            message: "Identifiant d'evenement invalide"
        }),
    quantity: z
        .number({ required_error: "La quantite est obligatoire", invalid_type_error: "La quantite doit etre un nombre entier" })
        .int("La quantite doit etre un nombre entier")
        .min(1, "La quantite minimale de reservation est de 1 place")
        .max(100, "La quantite maximale par reservation est de 100 places"),
    paymentMethod: z
        .string({ required_error: "Le mode de paiement est obligatoire" })
        .trim()
        .refine((val) => ALLOWED_PAYMENT_METHODS.includes(val), {
            message: "Mode de paiement invalide"
        })
});

const createPaymentSchema = z.object({
    reservationId: z
        .union([z.string(), z.number()], { required_error: "L'identifiant de reservation est obligatoire" })
        .transform((val) => Number(val))
        .refine((val) => Number.isInteger(val) && val > 0, {
            message: "Identifiant de reservation invalide"
        }),
    paymentMethod: z
        .string({ required_error: "Le mode de paiement est obligatoire" })
        .trim()
        .refine((val) => ALLOWED_PAYMENT_METHODS.includes(val), {
            message: "Mode de paiement invalide"
        })
});

function validateReservationInput(body) {
    if (!body || typeof body !== "object") {
        return { isValid: false, error: "Corps de requete manquant" };
    }

    const { eventId, quantity, paymentMethod } = body;
    const numericEventId = Number(eventId);
    const numericQuantity = Number(quantity);

    if (!Number.isInteger(numericEventId) || numericEventId <= 0) {
        return { isValid: false, error: "Identifiant d'evenement invalide" };
    }

    if (
        !Number.isInteger(numericQuantity) ||
        numericQuantity <= 0 ||
        numericQuantity > 100
    ) {
        return { isValid: false, error: "Quantite invalide (entre 1 et 100)" };
    }

    if (!paymentMethod || typeof paymentMethod !== "string" || !ALLOWED_PAYMENT_METHODS.includes(paymentMethod.trim())) {
        return { isValid: false, error: "Mode de paiement invalide" };
    }

    return {
        isValid: true,
        value: {
            eventId: numericEventId,
            quantity: numericQuantity,
            paymentMethod: paymentMethod.trim()
        }
    };
}

function validatePaymentInput(body) {
    if (!body || typeof body !== "object") {
        return { isValid: false, error: "Corps de requete manquant" };
    }

    const { reservationId, paymentMethod } = body;
    const numericReservationId = Number(reservationId);

    if (!Number.isInteger(numericReservationId) || numericReservationId <= 0) {
        return { isValid: false, error: "Identifiant de reservation invalide" };
    }

    if (!paymentMethod || typeof paymentMethod !== "string" || !ALLOWED_PAYMENT_METHODS.includes(paymentMethod.trim())) {
        return { isValid: false, error: "Mode de paiement invalide" };
    }

    return {
        isValid: true,
        value: {
            reservationId: numericReservationId,
            paymentMethod: paymentMethod.trim()
        }
    };
}

function validateReservationId(id) {
    const num = Number(id);
    if (!Number.isInteger(num) || num <= 0) {
        return { isValid: false, error: "Identifiant de reservation invalide" };
    }
    return { isValid: true, value: num };
}

function formatZodErrors(zodError) {
    if (!zodError || !zodError.issues) {
        return "Donnees invalides";
    }
    return zodError.issues.map((issue) => issue.message).join(", ");
}

module.exports = {
    ALLOWED_PAYMENT_METHODS,
    createReservationSchema,
    createPaymentSchema,
    validateReservationInput,
    validatePaymentInput,
    validateReservationId,
    formatZodErrors
};
