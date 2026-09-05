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
    const { data, error } = await supabase
        .from("events")
        .select("id, title, description, event_type, event_date, location, capacity, price")
        .eq("status", "APPROVED")
        .gte("event_date", new Date().toISOString())
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

module.exports = {
    createEvent,
    getMyEvents,
    submitEvent,
    getPendingEvents,
    approveEvent,
    rejectEvent,
    getApprovedEvents
};
