const supabaseConfig = require("../config/supabase");
const {
    validateReservationInput,
    validateReservationId
} = require("../validators/reservationValidator");
const { validateEventId } = require("../validators/eventValidator");

async function enrichOrganizerReservations(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return [];
    }

    const needsFallbackLookup = rows.some(
        (r) => r.participant_name === undefined && r.participant_email === undefined
    );

    const profileNameMap = {};
    const userEmailMap = {};

    if (needsFallbackLookup && process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseConfig.supabaseService) {
        const serviceClient = supabaseConfig.supabaseService;
        const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

        if (userIds.length > 0) {
            try {
                const { data: profiles } = await serviceClient
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", userIds);

                if (Array.isArray(profiles)) {
                    for (const p of profiles) {
                        if (p?.id && p.full_name) {
                            profileNameMap[p.id] = p.full_name;
                        }
                    }
                }
            } catch {
                // Non-blocking fallback
            }

            if (typeof serviceClient.auth?.admin?.getUserById === "function") {
                const results = await Promise.allSettled(
                    userIds.slice(0, 50).map((uid) => serviceClient.auth.admin.getUserById(uid))
                );
                for (const res of results) {
                    if (res.status === "fulfilled" && res.value?.data?.user) {
                        const authUser = res.value.data.user;
                        if (authUser.email) {
                            userEmailMap[authUser.id] = authUser.email;
                        }
                        if (!profileNameMap[authUser.id] && authUser.user_metadata?.full_name) {
                            profileNameMap[authUser.id] = authUser.user_metadata.full_name;
                        }
                    }
                }
            }
        }
    }

    return rows.map((row) => {
        const fullName =
            row.participant_name ||
            row.user?.fullName ||
            row.user?.full_name ||
            row.userName ||
            profileNameMap[row.user_id] ||
            "Participant";
        const email =
            row.participant_email ||
            row.user?.email ||
            row.userEmail ||
            userEmailMap[row.user_id] ||
            "";

        return {
            ...row,
            userName: fullName,
            userEmail: email,
            user: {
                fullName,
                email
            }
        };
    });
}

async function createReservation(req, res) {
    const validation = validateReservationInput(req.body);

    if (!validation.isValid) {
        return res.status(400).json({
            message: validation.error
        });
    }

    const { eventId, quantity } = validation.value;

    const { data, error } = await req.supabase.rpc(
        "create_reservation",
        {
            p_event_id: eventId,
            p_quantity: quantity
        }
    );

    if (error) {
        if (error.message && error.message.includes("one_reservation_per_user_event")) {
            return res.status(400).json({
                message: "Vous avez déjà une réservation enregistrée pour cet événement. Rendez-vous dans votre espace pour la consulter."
            });
        }
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
        .select("*, event:events(id, title, event_date, location, price, event_type)")
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

    const reservations = await enrichOrganizerReservations(data || []);

    return res.status(200).json({
        reservations
    });
}

module.exports = {
    createReservation,
    getMyReservations,
    cancelReservation,
    getEventReservations
};
