const { validateReservationId } = require("../validators/reservationValidator");

async function createPayment(req, res) {
    const reservationId = Number(req.body.reservationId);
    const paymentMethod = String(
        req.body.paymentMethod || ""
    ).toUpperCase();

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return res.status(400).json({
            message: "Identifiant de reservation invalide"
        });
    }

    if (
        ![
            "CARD",
            "PAYPAL",
            "MOBILE_MONEY",
            "ON_SITE"
        ].includes(paymentMethod)
    ) {
        return res.status(400).json({
            message: "Mode de paiement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "create_payment_for_reservation",
        {
            p_reservation_id: reservationId,
            p_payment_method: paymentMethod
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(201).json({
        message: "Paiement cree avec succes",
        payment: data
    });
}

async function getMyPayments(req, res) {
    const { data, error } = await req.supabase
        .from("payments")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les paiements"
        });
    }

    return res.status(200).json({
        payments: data
    });
}

async function getPendingPayments(req, res) {
    const { data, error } = await req.supabase
        .from("payments")
        .select("*")
        .eq("status", "PENDING")
        .eq("payment_method", "ON_SITE")
        .order("created_at", { ascending: true });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les paiements en attente"
        });
    }

    return res.status(200).json({
        payments: data
    });
}

async function confirmOnSitePayment(req, res) {
    const idValidation = validateReservationId(req.params.paymentId);

    if (!idValidation.isValid) {
        return res.status(400).json({
            message: "Identifiant de paiement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "confirm_on_site_payment",
        {
            p_payment_id: idValidation.value
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    // Trigger ticket confirmation email in background (fail-safe)
    triggerTicketEmailAsync(req.supabase, { paymentId: idValidation.value });

    return res.status(200).json({
        message: "Paiement sur place confirme",
        payment: data
    });
}

const {
    initiateStripeCheckout,
    initiateMobileMoneyPayment,
    confirmOnlinePayment
} = require("../services/paymentService");
const { sendTicketConfirmationEmail } = require("../services/emailService");

async function triggerTicketEmailAsync(supabase, { paymentId, recipientEmail, recipientName }) {
    if (!paymentId || !supabase || typeof supabase.from !== "function") return;
    try {
        const { data: payment } = await supabase
            .from("payments")
            .select("id, amount, currency, reservation_id, metadata")
            .eq("id", paymentId)
            .maybeSingle();

        if (!payment) return;

        const { data: reservation } = await supabase
            .from("reservations")
            .select("id, event:events(title, event_date, location), tickets(id, ticket_code)")
            .eq("id", payment.reservation_id)
            .maybeSingle();

        const to = recipientEmail || payment.metadata?.customerEmail;
        if (!to) return;

        const name = recipientName || payment.metadata?.customerName || "Participant";
        const eventTitle = reservation?.event?.title || "Événement MyTicket";
        const eventDate = reservation?.event?.event_date;
        const eventLocation = reservation?.event?.location;
        const tickets = reservation?.tickets || [];

        await sendTicketConfirmationEmail({
            to,
            userName: name,
            eventTitle,
            eventDate,
            eventLocation,
            tickets,
            totalAmount: payment.amount,
            currency: payment.currency || "XOF",
        });
    } catch (err) {
        console.warn("[paymentController] Notice: non-blocking email trigger skipped:", err.message);
    }
}


async function initiateCheckout(req, res) {
    const reservationId = Number(req.body.reservationId);
    const paymentMethod = String(req.body.paymentMethod || "").toUpperCase();
    const phoneNumber = req.body.phoneNumber;

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return res.status(400).json({
            message: "Identifiant de reservation invalide"
        });
    }

    if (!["CARD", "MOBILE_MONEY", "ON_SITE"].includes(paymentMethod)) {
        return res.status(400).json({
            message: "Mode de paiement invalide (CARD, MOBILE_MONEY ou ON_SITE requis)"
        });
    }

    // 1. Creer la ligne de paiement transactionnelle
    const { data: payment, error: paymentError } = await req.supabase.rpc(
        "create_payment_for_reservation",
        {
            p_reservation_id: reservationId,
            p_payment_method: paymentMethod
        }
    );

    if (paymentError || !payment) {
        return res.status(400).json({
            message: paymentError ? paymentError.message : "Erreur lors de la creation du paiement"
        });
    }

    // 2. Recuperer les details de la reservation et de l'evenement
    const { data: reservation } = await req.supabase
        .from("reservations")
        .select("id, quantity, event_id")
        .eq("id", reservationId)
        .single();

    const { data: event } = reservation
        ? await req.supabase
              .from("events")
              .select("id, title, price, currency")
              .eq("id", reservation.event_id)
              .single()
        : { data: {} };

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3333").split(",")[0].trim();

    // 3. Traiter selon le mode de paiement
    try {
        if (paymentMethod === "CARD") {
            const checkoutResult = await initiateStripeCheckout({
                payment,
                reservation: reservation || { id: reservationId, quantity: 1 },
                event: event || { title: "Billet Evenement", price: payment.amount },
                frontendUrl
            });

            return res.status(201).json({
                message: "Session de paiement par carte initialisee",
                payment,
                checkoutUrl: checkoutResult.checkoutUrl,
                providerPaymentId: checkoutResult.providerPaymentId
            });
        }

        if (paymentMethod === "MOBILE_MONEY") {
            const mmResult = await initiateMobileMoneyPayment({
                payment,
                reservation: reservation || { id: reservationId, quantity: 1 },
                event: event || { title: "Billet Evenement", price: payment.amount },
                phoneNumber
            });

            return res.status(201).json({
                message: "Paiement Mobile Money initialise",
                payment,
                ...mmResult
            });
        }

        // ON_SITE
        return res.status(201).json({
            message: "Paiement sur place enregistre",
            payment,
            instructions: "Presentez-vous a l'entree de l'evenement pour regler vos places et retirer vos billets."
        });
    } catch (err) {
        return res.status(400).json({
            message: err.message || "Erreur lors de l'initialisation du paiement"
        });
    }
}

async function handleStripeWebhook(req, res) {
    const { paymentId, providerPaymentId, status } = req.body || {};

    if (!paymentId) {
        return res.status(400).json({ message: "paymentId requis" });
    }

    try {
        if (status === "SUCCEEDED" || !status) {
            const updatedPayment = await confirmOnlinePayment(req.supabase, {
                paymentId: Number(paymentId),
                providerPaymentId: providerPaymentId || `stripe_evt_${Date.now()}`,
                provider: "STRIPE",
                metadata: req.body
            });

            // Envoi d'email de confirmation asynchrone non-bloquant
            triggerTicketEmailAsync(req.supabase, {
                paymentId: Number(paymentId),
                recipientEmail: req.body?.customerEmail || req.body?.email,
                recipientName: req.body?.customerName
            });

            return res.status(200).json({
                message: "Paiement confirme avec succes",
                payment: updatedPayment
            });
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

async function handleMobileMoneyWebhook(req, res) {
    const { paymentId, transactionRef, status } = req.body || {};

    if (!paymentId) {
        return res.status(400).json({ message: "paymentId requis" });
    }

    try {
        if (status === "SUCCESS" || status === "SUCCEEDED" || !status) {
            const updatedPayment = await confirmOnlinePayment(req.supabase, {
                paymentId: Number(paymentId),
                providerPaymentId: transactionRef || `mm_evt_${Date.now()}`,
                provider: "MOBILE_MONEY",
                metadata: req.body
            });

            // Envoi d'email de confirmation asynchrone non-bloquant
            triggerTicketEmailAsync(req.supabase, {
                paymentId: Number(paymentId),
                recipientEmail: req.body?.customerEmail || req.body?.email,
                recipientName: req.body?.customerName
            });

            return res.status(200).json({
                message: "Paiement Mobile Money confirme avec succes",
                payment: updatedPayment
            });
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

module.exports = {
    createPayment,
    getMyPayments,
    getPendingPayments,
    confirmOnSitePayment,
    initiateCheckout,
    handleStripeWebhook,
    handleMobileMoneyWebhook
};