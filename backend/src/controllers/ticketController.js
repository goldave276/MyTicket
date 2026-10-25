const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getMyTickets(req, res) {
    const { data, error } = await req.supabase
        .from("tickets")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les tickets"
        });
    }

    return res.status(200).json({
        tickets: data
    });
}

async function scanTicket(req, res) {
    const { ticketCode, eventId } = req.body || {};
    const parsedEventId = Number(eventId);

    if (!ticketCode || typeof ticketCode !== "string" || !UUID_REGEX.test(ticketCode.trim())) {
        return res.status(400).json({
            message: "Format du code de billet invalide (UUID attendu)"
        });
    }

    if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
        return res.status(400).json({
            message: "Identifiant d'evenement invalide"
        });
    }

    const { data, error } = await req.supabase.rpc("scan_and_checkin_ticket", {
        p_ticket_code: ticketCode.trim(),
        p_event_id: parsedEventId
    });

    if (error) {
        const errorMsg = error.message || "Erreur lors de la validation du billet";

        if (errorMsg.includes("deja utilise")) {
            return res.status(409).json({
                message: errorMsg,
                alreadyScanned: true
            });
        }

        if (errorMsg.includes("introuvable")) {
            return res.status(404).json({
                message: errorMsg
            });
        }

        if (errorMsg.includes("annule")) {
            return res.status(410).json({
                message: errorMsg,
                cancelled: true
            });
        }

        if (errorMsg.includes("Permission")) {
            return res.status(403).json({
                message: errorMsg
            });
        }

        return res.status(400).json({
            message: errorMsg
        });
    }

    return res.status(200).json({
        message: "Entree validee avec succes",
        checkin: data
    });
}

async function getEventCheckinSummary(req, res) {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Identifiant d'evenement invalide"
        });
    }

    const { data: tickets, error } = await req.supabase
        .from("tickets")
        .select("id, status, scanned_at")
        .eq("event_id", eventId);

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les statistiques d'entree"
        });
    }

    const totalTickets = (tickets || []).length;
    const scannedTickets = (tickets || []).filter(t => t.status === "USED").length;
    const remainingTickets = totalTickets - scannedTickets;
    const attendanceRate = totalTickets > 0 ? Math.round((scannedTickets / totalTickets) * 100) : 0;

    return res.status(200).json({
        eventId,
        totalTickets,
        scannedTickets,
        remainingTickets,
        attendanceRate
    });
}

module.exports = {
    getMyTickets,
    scanTicket,
    getEventCheckinSummary
};