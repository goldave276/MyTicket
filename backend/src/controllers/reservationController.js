const { validateReservationId } = require("../validators/reservationValidator");
const { validateEventId } = require("../validators/eventValidator");

async function createReservation(req, res) {
    const eventId = Number(req.body.eventId);
    const quantity = Number(req.body.quantity);

    if (
        !Number.isInteger(eventId) ||
        eventId <= 0 ||
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
    const idValidation = validateReservationId(req.params.reservationId);

    if (!idValidation.isValid) {
        return res.status(400).json({
            message: idValidation.error
        });
    }

    const { data, error } = await req.supabase.rpc(
        "cancel_reservation",
        {
            p_reservation_id: idValidation.value
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
    const idValidation = validateEventId(req.params.eventId);

    if (!idValidation.isValid) {
        return res.status(400).json({
            message: idValidation.error
        });
    }

    const { data, error } = await req.supabase.rpc(
        "get_organizer_event_reservations",
        { p_event_id: idValidation.value }
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
