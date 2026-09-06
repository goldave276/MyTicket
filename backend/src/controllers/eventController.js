const { supabase } = require("../config/supabase");
const { validateEventQuery, escapePostgrestValue } = require("../validators/eventQueryValidator");
const { validateEventInput, validateEventId } = require("../validators/eventValidator");

async function createEvent(req, res) {
    const validation = validateEventInput(req.body);
    if (!validation.isValid) {
        return res.status(400).json({
            message: validation.error
        });
    }

    const {
        title,
        description,
        eventType,
        parsedDate,
        location,
        capacity,
        price
    } = validation.value;

    const { data, error } = await req.supabase
        .from("events")
        .insert({
            organizer_id: req.user.id,
            title,
            description,
            event_type: eventType,
            event_date: parsedDate.toISOString(),
            location,
            capacity,
            price
        })
        .select()
        .single();

    if (error) {
        return res.status(500).json({
            message: "Impossible de creer l'evenement"
        });
    }

    return res.status(201).json({
        event: data
    });
}

async function getMyEvents(req, res) {
    const { data, error } = await req.supabase
        .from("events")
        .select("*")
        .eq("organizer_id", req.user.id)
        .order("event_date", { ascending: true });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les evenements"
        });
    }

    return res.status(200).json({
        events: data
    });
}

async function submitEvent(req, res) {
    const idValidation = validateEventId(req.params.eventId);
    if (!idValidation.isValid) {
        return res.status(400).json({
            message: idValidation.error
        });
    }

    const { data, error } = await req.supabase.rpc(
        "submit_event",
        {
            p_event_id: idValidation.value
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Evenement soumis pour validation",
        event: data
    });
}

async function updateEvent(req, res) {
    const idValidation = validateEventId(req.params.eventId);
    if (!idValidation.isValid) {
        return res.status(400).json({ message: idValidation.error });
    }

    const validation = validateEventInput(req.body);
    if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
    }

    const {
        title,
        description,
        eventType,
        parsedDate,
        location,
        capacity,
        price
    } = validation.value;

    const { data, error } = await req.supabase.rpc("update_event", {
        p_event_id: idValidation.value,
        p_title: title,
        p_description: description,
        p_event_type: eventType,
        p_event_date: parsedDate.toISOString(),
        p_location: location,
        p_capacity: capacity,
        p_price: price
    });

    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ message: "Evenement modifie avec succes", event: data });
}

async function cancelEvent(req, res) {
    const idValidation = validateEventId(req.params.eventId);
    if (!idValidation.isValid) {
        return res.status(400).json({
            message: idValidation.error
        });
    }

    const { data, error } = await req.supabase.rpc(
        "cancel_event",
        { p_event_id: idValidation.value }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Evenement annule avec succes",
        event: data
    });
}

async function getPendingEvents(req, res) {
    const { data, error } = await req.supabase
        .from("events")
        .select("*")
        .eq("status", "PENDING")
        .order("created_at", { ascending: true });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les evenements en attente"
        });
    }

    return res.status(200).json({
        events: data
    });
}

async function approveEvent(req, res) {
    const idValidation = validateEventId(req.params.eventId);
    if (!idValidation.isValid) {
        return res.status(400).json({
            message: idValidation.error
        });
    }

    const { data, error } = await req.supabase.rpc(
        "approve_event",
        {
            p_event_id: idValidation.value
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Evenement approuve avec succes",
        event: data
    });
}

async function rejectEvent(req, res) {
    const idValidation = validateEventId(req.params.eventId);
    if (!idValidation.isValid) {
        return res.status(400).json({
            message: idValidation.error
        });
    }

    const { data, error } = await req.supabase.rpc(
        "reject_event",
        {
            p_event_id: idValidation.value
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Evenement refuse avec succes",
        event: data
    });
}

async function getApprovedEvents(req, res) {
    const validation = validateEventQuery(req.query);

    if (!validation.isValid) {
        return res.status(400).json({
            message: "Filtres invalides",
            errors: validation.errors
        });
    }

    const {
        search,
        eventType,
        location,
        dateFrom,
        dateTo,
        minPrice,
        maxPrice,
        page,
        limit
    } = validation.value;

    let query = supabase
        .from("events")
        .select("id, title, description, event_type, event_date, location, capacity, price", { count: "exact" })
        .eq("status", "APPROVED")
        .gte("event_date", dateFrom || new Date().toISOString());

    if (dateTo) query = query.lte("event_date", dateTo);
    if (eventType) query = query.ilike("event_type", `%${eventType}%`);
    if (location) query = query.ilike("location", `%${location}%`);
    if (search) {
        const escaped = escapePostgrestValue(search);
        if (escaped) {
            query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%,location.ilike.%${escaped}%`);
        }
    }
    if (minPrice !== undefined) query = query.gte("price", minPrice);
    if (maxPrice !== undefined) query = query.lte("price", maxPrice);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
        .order("event_date", { ascending: true })
        .range(from, to);

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les evenements"
        });
    }

    return res.status(200).json({
        events: data || [],
        pagination: {
            page,
            limit,
            total: count ?? (data ? data.length : 0)
        }
    });
}

async function getOrganizerStats(req, res) {
    const { data: rpcData, error: rpcError } = await req.supabase.rpc("get_organizer_stats");

    if (!rpcError && rpcData) {
        return res.status(200).json({
            stats: rpcData
        });
    }

    try {
        const { data: myEvents, error: eventsError } = await req.supabase
            .from("events")
            .select("id, status, capacity, price")
            .eq("organizer_id", req.user.id);

        if (eventsError) {
            return res.status(500).json({
                message: "Impossible de recuperer les statistiques de l'organisateur"
            });
        }

        const eventIds = (myEvents || []).map(e => e.id);

        let reservations = [];
        if (eventIds.length > 0) {
            const { data: resData, error: resError } = await req.supabase
                .from("reservations")
                .select("id, event_id, status, quantity")
                .in("event_id", eventIds);

            if (!resError && resData) {
                reservations = resData;
            }
        }

        const eventsSummary = {
            total: (myEvents || []).length,
            draft: (myEvents || []).filter(e => e.status === "DRAFT").length,
            pending: (myEvents || []).filter(e => e.status === "PENDING").length,
            approved: (myEvents || []).filter(e => e.status === "APPROVED").length,
            rejected: (myEvents || []).filter(e => e.status === "REJECTED").length,
            cancelled: (myEvents || []).filter(e => e.status === "CANCELLED").length,
            finished: (myEvents || []).filter(e => e.status === "FINISHED").length,
            totalCapacity: (myEvents || []).reduce((sum, e) => sum + (Number(e.capacity) || 0), 0)
        };

        const confirmedReservations = reservations.filter(r => r.status === "CONFIRMED");
        const ticketsSold = confirmedReservations.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

        const eventPriceMap = new Map((myEvents || []).map(e => [e.id, Number(e.price) || 0]));
        const estimatedRevenue = confirmedReservations.reduce((sum, r) => {
            const price = eventPriceMap.get(r.event_id) || 0;
            return sum + (price * (Number(r.quantity) || 0));
        }, 0);

        return res.status(200).json({
            stats: {
                events: eventsSummary,
                reservations: {
                    total: reservations.length,
                    confirmed: confirmedReservations.length,
                    pending: reservations.filter(r => r.status === "PENDING").length,
                    cancelled: reservations.filter(r => r.status === "CANCELLED").length,
                    ticketsSold
                },
                revenue: {
                    estimatedRevenue,
                    currency: "XOF"
                }
            }
        });
    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors du calcul des statistiques organisateur"
        });
    }
}

module.exports = {
    createEvent,
    getMyEvents,
    updateEvent,
    submitEvent,
    cancelEvent,
    getPendingEvents,
    approveEvent,
    rejectEvent,
    getApprovedEvents,
    getOrganizerStats
};
