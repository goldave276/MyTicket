async function createPayment(req, res) {
    const reservationId = Number(req.body.reservationId);
    const paymentMethod = String(
        req.body.paymentMethod || ""
    ).toUpperCase();

    if (!Number.isInteger(reservationId)) {
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
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId)) {
        return res.status(400).json({
            message: "Identifiant de paiement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "confirm_on_site_payment",
        {
            p_payment_id: paymentId
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Paiement sur place confirme",
        payment: data
    });
}

module.exports = {
    createPayment,
    getMyPayments,
    getPendingPayments,
    confirmOnSitePayment
};