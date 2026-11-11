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
        .order("id", { ascending: true })
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

async function getPublicEventDetail(req, res) {
    const idValidation = validateEventId(req.params.eventId);

    if (!idValidation.isValid) {
        return res.status(400).json({ message: idValidation.error });
    }

    const { data, error } = await supabase.rpc("get_public_event_detail", {
        p_event_id: idValidation.value
    });

    if (error) {
        // Fallback resilient : interrogation directe de la table events si la RPC n'est pas installee ou echoue
        const { data: fallbackEvent, error: fallbackError } = await supabase
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

        const { data: reservationsData } = await supabase
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
