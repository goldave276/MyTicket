async function createReservation(req, res) {
    const eventId = Number(req.body.eventId);
    const quantity = Number(req.body.quantity);

    if (
        !Number.isInteger(eventId) ||
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            message: "Evenement ou quantite invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "create_reservation",
        {
            p_event_id: eventId,
            p_quantity: quantity
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(201).json({
        message: "Reservation creee avec succes",
        reservation: data
    });
}

async function getMyReservations(req, res) {
    const { data, error } = await req.supabase
        .from("reservations")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les reservations"
        });
    }

    return res.status(200).json({
        reservations: data
    });
}

async function cancelReservation(req, res) {
    const reservationId = Number(req.params.reservationId);

    if (!Number.isInteger(reservationId)) {
        return res.status(400).json({
            message: "Identifiant de reservation invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "cancel_reservation",
        {
            p_reservation_id: reservationId
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Reservation annulee avec succes",
        reservation: data
    });
}

async function getEventReservations(req, res) {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId)) {
        return res.status(400).json({
            message: "Identifiant d'evenement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "get_organizer_event_reservations",
        { p_event_id: eventId }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        reservations: data
    });
}

module.exports = {
    createReservation,
    getMyReservations,
    cancelReservation,
    getEventReservations
};
