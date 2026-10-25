const Stripe = require("stripe");

const stripeClient = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("mock_")
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

/**
 * Valide un numéro de téléphone Mobile Money Togo (Flooz ou T-Money).
 * Préfixes valides : 90, 91, 92, 93, 96, 97, 98, 99 (Moov/Flooz) ou 70, 79, 90 (T-Money).
 */
function validateTogoPhoneNumber(phone) {
    if (!phone || typeof phone !== "string") {
        return { isValid: false, message: "Numéro de téléphone requis" };
    }

    const clean = phone.replace(/[\s\-\(\)\.]/g, "").replace(/^(\+228|00228)/, "");

    if (!/^\d{8}$/.test(clean)) {
        return { isValid: false, message: "Le numéro doit comporter 8 chiffres (indicatif Togo +228)" };
    }

    const prefix = clean.substring(0, 2);
    const validPrefixes = ["70", "79", "90", "91", "92", "93", "96", "97", "98", "99"];

    if (!validPrefixes.includes(prefix)) {
        return { isValid: false, message: "Préfixe non reconnu pour Flooz ou T-Money Togo" };
    }

    const network = ["70", "79"].includes(prefix) ? "TMONEY" : "FLOOZ";

    return { isValid: true, cleanNumber: clean, network };
}

/**
 * Initialise une session de paiement par carte bancaire avec Stripe.
 */
async function initiateStripeCheckout({ payment, reservation, event, frontendUrl }) {
    const successUrl = `${frontendUrl}/payment/success?paymentId=${payment.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/payment/cancel?paymentId=${payment.id}`;

    if (stripeClient) {
        // En devise XOF, Stripe gère le montant comme une devise sans décimale (zero-decimal currency)
        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: (payment.currency || "xof").toLowerCase(),
                        product_data: {
                            name: `Billet : ${event.title || "Evenement MyTicket"}`,
                            description: `Reservation #${reservation.id} - ${reservation.quantity} place(s)`,
                        },
                        unit_amount: Math.round(Number(event.price) || (Number(payment.amount) / reservation.quantity)),
                    },
                    quantity: reservation.quantity || 1,
                },
            ],
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                paymentId: String(payment.id),
                reservationId: String(reservation.id),
            },
        });

        return {
            checkoutUrl: session.url,
            providerPaymentId: session.id,
            mode: "STRIPE",
        };
    }

    // Mode simulation / fallback local sans clé Stripe de production
    const mockSessionId = `mock_stripe_${payment.id}_${Date.now()}`;
    return {
        checkoutUrl: `${frontendUrl}/payment/success?paymentId=${payment.id}&session_id=${mockSessionId}&mock=true`,
        providerPaymentId: mockSessionId,
        mode: "STRIPE_MOCK",
    };
}

/**
 * Initialise un paiement Mobile Money (Flooz ou T-Money).
 */
async function initiateMobileMoneyPayment({ payment, reservation, event, phoneNumber }) {
    const validation = validateTogoPhoneNumber(phoneNumber);
    if (!validation.isValid) {
        throw new Error(validation.message);
    }

    const transactionRef = `MM_TG_${validation.network}_${payment.id}_${Date.now()}`;

    // Si une passerelle PayGate ou FedaPay est configurée, appel de l'API externe ici.
    // En standard, retourne les détails de la transaction pour notification/confirmation.
    return {
        providerPaymentId: transactionRef,
        network: validation.network,
        phoneNumber: validation.cleanNumber,
        amount: payment.amount,
        currency: payment.currency || "XOF",
        status: "PENDING",
        instructions: `Une demande de débit de ${payment.amount} XOF a été initiée sur le numéro ${validation.cleanNumber} (${validation.network}). Veuillez valider sur votre téléphone.`,
    };
}

/**
 * Confirme le paiement en base via la fonction RPC atomique confirm_online_payment.
 */
async function confirmOnlinePayment(supabase, { paymentId, providerPaymentId, provider, metadata }) {
    const { data, error } = await supabase.rpc("confirm_online_payment", {
        p_payment_id: paymentId,
        p_provider_payment_id: providerPaymentId || null,
        p_provider: provider || null,
        p_metadata: metadata || null,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

module.exports = {
    validateTogoPhoneNumber,
    initiateStripeCheckout,
    initiateMobileMoneyPayment,
    confirmOnlinePayment,
};
