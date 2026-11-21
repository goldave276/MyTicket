const supabaseConfig = require("../config/supabase");
const { validateEventQuery, escapePostgrestValue } = require("../validators/eventQueryValidator");
const { validateEventInput, validateEventId } = require("../validators/eventValidator");

function getServerReservationsReader(authClient) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseConfig.supabaseService) {
        return supabaseConfig.supabaseService;
    }
    return authClient || supabaseConfig.supabase;
}

async function fetchBookedSeatsByEventIds(events, { authClient } = {}) {
    if (!Array.isArray(events) || events.length === 0) {
        return {};
    }

    const eventIds = [...new Set(
        events
            .map((evt) => Number(evt?.id))
            .filter((id) => Number.isSafeInteger(id) && id > 0)
    )];

    if (eventIds.length === 0) {
        return {};
    }

    const publicClient = supabaseConfig.supabase;
    if (publicClient && typeof publicClient.rpc === "function") {
        try {
            const { data, error } = await publicClient.rpc("get_events_booked_counts", {
                p_event_ids: eventIds
            });
            if (!error && Array.isArray(data)) {
                return data.reduce((acc, row) => {
                    const id = Number(row.event_id);
                    if (Number.isSafeInteger(id)) {
                        acc[id] = Number(row.booked_seats) || 0;
                    }
                    return acc;
                }, {});
            }
        } catch {
            // Fallback to direct reservations aggregation below
        }
    }

    const reader = getServerReservationsReader(authClient);
    if (!reader || typeof reader.from !== "function") {
        return {};
    }

    try {
        let query = reader
            .from("reservations")
            .select("event_id, quantity");

        if (eventIds.length === 1 && typeof query.eq === "function") {
            query = query.eq("event_id", eventIds[0]);
        } else if (typeof query.in === "function") {
            query = query.in("event_id", eventIds);
        }

        if (typeof query.in !== "function") {
            return {};
        }

        const { data: reservationsData, error } = await query.in("status", ["PENDING", "CONFIRMED"]);
        if (error || !Array.isArray(reservationsData)) {
            return {};
        }

        return reservationsData.reduce((acc, row) => {
            const id = Number(row.event_id ?? eventIds[0]);
            if (Number.isSafeInteger(id)) {
                acc[id] = (acc[id] || 0) + (Number(row.quantity) || 0);
            }
            return acc;
        }, {});
    } catch {
        return {};
    }
}

async function enrichEventsWithAvailability(events, options = {}) {
    if (!Array.isArray(events) || events.length === 0) {
        return [];
    }

    const bookedByEventId = await fetchBookedSeatsByEventIds(events, options);
    return events.map((event) => {
        const capacity = Number(event.capacity ?? 0);
        const bookedSeats = Math.max(0, Number(bookedByEventId[Number(event.id)] ?? 0));
        const remainingCapacity = Math.max(0, capacity - bookedSeats);
        return {
            ...event,
            bookedSeats,
            booked_seats: bookedSeats,
            remainingCapacity,
            remaining_capacity: remainingCapacity
        };
    });
}

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

    const events = await enrichEventsWithAvailability(data || [], {
        authClient: req.supabase
    });

    return res.status(200).json({
        events
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

    let query = supabaseConfig.supabase
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
        .order("id", { ascending: true })
        .range(from, to);

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les evenements"
        });
    }

    const events = await enrichEventsWithAvailability(data || []);

    return res.status(200).json({
        events,
        pagination: {
            page,
            limit,
            total: count ?? events.length
        }
    });
}

async function getPublicEventDetail(req, res) {
    const idValidation = validateEventId(req.params.eventId);

    if (!idValidation.isValid) {
        return res.status(400).json({ message: idValidation.error });
    }

    const userId = req.user?.id;
    const userRole = req.profile?.role;

    // Si utilisateur connecté créateur de l'événement ou ADMIN, autoriser l'accès direct même non-APPROVED
    if (userId && req.supabase) {
        let ownQuery = req.supabase
            .from("events")
            .select("id, title, description, event_type, event_date, location, capacity, price, status, organizer_id")
            .eq("id", idValidation.value);

        if (userRole !== "ADMIN") {
            ownQuery = ownQuery.eq("organizer_id", userId);
        }

        const { data: ownEvent } = await ownQuery.maybeSingle();
        if (ownEvent) {
            const [enrichedOwn] = await enrichEventsWithAvailability([ownEvent], {
                authClient: req.supabase
            });

            return res.status(200).json({
                event: {
                    id: ownEvent.id,
                    title: ownEvent.title,
                    description: ownEvent.description,
                    eventType: ownEvent.event_type,
                    event_type: ownEvent.event_type,
                    eventDate: ownEvent.event_date,
                    event_date: ownEvent.event_date,
                    location: ownEvent.location,
                    capacity: ownEvent.capacity,
                    price: ownEvent.price,
                    status: ownEvent.status,
                    organizerId: ownEvent.organizer_id,
                    organizer_id: ownEvent.organizer_id,
                    bookedSeats: enrichedOwn.bookedSeats,
                    remainingCapacity: enrichedOwn.remainingCapacity,
                    remaining_capacity: enrichedOwn.remainingCapacity
                }
            });
        }
    }

    const { data, error } = await supabaseConfig.supabase.rpc("get_public_event_detail", {
        p_event_id: idValidation.value
    });

    if (error) {
        // Fallback resilient : interrogation directe de la table events si la RPC n'est pas installee ou echoue
        const { data: fallbackEvent, error: fallbackError } = await supabaseConfig.supabase
            .from("events")
            .select("id, title, description, event_type, event_date, location, capacity, price, status, organizer_id")
            .eq("id", idValidation.value)
            .eq("status", "APPROVED")
            .gt("event_date", new Date().toISOString())
            .maybeSingle();

        if (fallbackError) {
            return res.status(500).json({
                message: "Impossible de recuperer le detail de l'evenement"
            });
        }

        if (!fallbackEvent) {
            return res.status(404).json({ message: "Evenement introuvable" });
        }

        const reader = getServerReservationsReader();
        const { data: reservationsData } = await reader
            .from("reservations")
            .select("quantity")
            .eq("event_id", idValidation.value)
            .in("status", ["PENDING", "CONFIRMED"]);

        const bookedSeats = Array.isArray(reservationsData)
            ? reservationsData.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0)
            : 0;

        const remainingCapacity = Math.max(0, Number(fallbackEvent.capacity || 0) - bookedSeats);

        return res.status(200).json({
            event: {
                id: fallbackEvent.id,
                title: fallbackEvent.title,
                description: fallbackEvent.description,
                eventType: fallbackEvent.event_type,
                event_type: fallbackEvent.event_type,
                eventDate: fallbackEvent.event_date,
                event_date: fallbackEvent.event_date,
                location: fallbackEvent.location,
                capacity: fallbackEvent.capacity,
                price: fallbackEvent.price,
                status: fallbackEvent.status,
                organizerId: fallbackEvent.organizer_id,
                organizer_id: fallbackEvent.organizer_id,
                remainingCapacity,
                remaining_capacity: remainingCapacity
            }
        });
    }

    if (!data) {
        return res.status(404).json({ message: "Evenement introuvable" });
    }

    return res.status(200).json({ event: data });
}

async function deleteEvent(req, res) {
    const idValidation = validateEventId(req.params.eventId);
    if (!idValidation.isValid) {
        return res.status(400).json({
            message: idValidation.error
        });
    }

    const forceDelete = req.query.force === "true" || req.body?.force === true;

    const { data, error } = await req.supabase.rpc(
        "delete_or_cancel_event",
        {
            p_event_id: idValidation.value,
            p_force_delete: forceDelete
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    const isDeleted = data?.action === "DELETED";
    return res.status(200).json({
        message: isDeleted
            ? "Evenement supprime definitivement avec succes"
            : "Evenement annule et retire de la billetterie avec succes",
        result: data
    });
}

async function getAllEventsForAdmin(req, res) {
    let query = req.supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

    if (req.query?.status) {
        query = query.eq("status", req.query.status);
    }

    const { data, error } = await query;
    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les evenements"
        });
    }

    return res.status(200).json({
        events: data || []
    });
}

async function getOrganizerStats(req, res) {
    const { data, error } = await req.supabase.rpc("get_organizer_stats");

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les statistiques de l'organisateur"
        });
    }

    return res.status(200).json({
        stats: data
    });
}

module.exports = {
    createEvent,
    getMyEvents,
    updateEvent,
    submitEvent,
    cancelEvent,
    deleteEvent,
    getPendingEvents,
    getAllEventsForAdmin,
    approveEvent,
    rejectEvent,
    getApprovedEvents,
    getPublicEventDetail,
    getOrganizerStats
};
