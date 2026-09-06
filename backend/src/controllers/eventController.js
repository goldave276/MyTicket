const { supabase } = require("../config/supabase");


async function createEvent(req, res) {
    const {
        title,
        description,
        eventType,
        eventDate,
        location,
        capacity,
        price
    } = req.body;

    const numericCapacity = Number(capacity);
    const numericPrice = Number(price);
    const parsedDate = new Date(eventDate);

    if (
        typeof title !== "string" ||
        typeof description !== "string" ||
        typeof eventType !== "string" ||
        typeof eventDate !== "string" ||
        typeof location !== "string" ||
        !title.trim() ||
        !description.trim() ||
        !eventType.trim() ||
        !eventDate.trim() ||
        !location.trim() ||
        capacity === undefined ||
        capacity === null ||
        capacity === ""
    ) {
        return res.status(400).json({
            message: "Les informations obligatoires sont manquantes"
        });
    }

    if (
        !Number.isFinite(numericCapacity) ||
        !Number.isInteger(numericCapacity) ||
        numericCapacity <= 0
    ) {
        return res.status(400).json({
            message: "La capacite doit etre un entier positif"
        });
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
            message: "Le prix doit etre positif ou nul"
        });
    }

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate <= new Date()
    ) {
        return res.status(400).json({
            message: "La date doit etre valide et future"
        });
    }

    const { data, error } = await req.supabase
        .from("events")
        .insert({
            organizer_id: req.user.id,
            title,
            description,
            event_type: eventType,
            event_date: parsedDate.toISOString(),
            location,
            capacity: numericCapacity,
            price: numericPrice
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
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId)) {
        return res.status(400).json({
            message: "Identifiant d'evenement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "submit_event",
        {
            p_event_id: eventId
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
    const eventId = Number(req.params.eventId);
    const {
        title,
        description,
        eventType,
        eventDate,
        location,
        capacity,
        price
    } = req.body;
    const numericCapacity = Number(capacity);
    const numericPrice = Number(price);
    const parsedDate = new Date(eventDate);

    if (!Number.isInteger(eventId)) {
        return res.status(400).json({ message: "Identifiant d'evenement invalide" });
    }
    if (![title, description, eventType, eventDate, location].every(
        (value) => typeof value === "string" && value.trim()
    )) {
        return res.status(400).json({ message: "Les informations obligatoires sont manquantes" });
    }
    if (!Number.isInteger(numericCapacity) || numericCapacity <= 0) {
        return res.status(400).json({ message: "La capacite doit etre un entier positif" });
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Le prix doit etre positif ou nul" });
    }
    if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        return res.status(400).json({ message: "La date doit etre valide et future" });
    }

    const { data, error } = await req.supabase.rpc("update_event", {
        p_event_id: eventId,
        p_title: title,
        p_description: description,
        p_event_type: eventType,
        p_event_date: parsedDate.toISOString(),
        p_location: location,
        p_capacity: numericCapacity,
        p_price: numericPrice
    });

    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ message: "Evenement modifie avec succes", event: data });
}

async function cancelEvent(req, res) {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId)) {
        return res.status(400).json({
            message: "Identifiant d'evenement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "cancel_event",
        { p_event_id: eventId }
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
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId)) {
        return res.status(400).json({
            message: "Identifiant d'evenement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "approve_event",
        {
            p_event_id: eventId
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
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId)) {
        return res.status(400).json({
            message: "Identifiant d'evenement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "reject_event",
        {
            p_event_id: eventId
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
    const {
        search,
        eventType,
        location,
        dateFrom,
        dateTo,
        minPrice,
        maxPrice
    } = req.query || {};
    let query = supabase
        .from("events")
        .select("id, title, description, event_type, event_date, location, capacity, price")
        .eq("status", "APPROVED")
        .gte("event_date", dateFrom || new Date().toISOString());

    if (dateTo) query = query.lte("event_date", dateTo);
    if (eventType) query = query.ilike("event_type", `%${eventType}%`);
    if (location) query = query.ilike("location", `%${location}%`);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    if (minPrice !== undefined) query = query.gte("price", Number(minPrice));
    if (maxPrice !== undefined) query = query.lte("price", Number(maxPrice));

    const { data, error } = await query.order("event_date", { ascending: true });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les evenements"
        });
    }

    return res.status(200).json({
        events: data
    });
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
    getApprovedEvents
};
