async function createOrganizerRequest(req, res) {
    const { eventType, documentPath } = req.body;

    if (!eventType || !documentPath) {
        return res.status(400).json({
            message: "Le type d'evenement et le document sont obligatoires"
        });
    }

    const { data, error } = await req.supabase
        .from("organizer_requests")
        .insert({
            user_id: req.user.id,
            event_type: eventType,
            document_path: documentPath
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Une demande est deja en attente"
            });
        }

        return res.status(500).json({
            message: "Impossible de creer la demande"
        });
    }

    return res.status(201).json({
        request: data
    });
}

async function getMyOrganizerRequests(req, res) {
    const { data, error } = await req.supabase
        .from("organizer_requests")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les demandes"
        });
    }

    return res.status(200).json({
        requests: data
    });
}

async function getAllOrganizerRequests(req, res) {
    const { data, error } = await req.supabase
        .from("organizer_requests")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les demandes"
        });
    }

    return res.status(200).json({
        requests: data
    });
}

async function approveOrganizerRequest(req, res) {
    const requestId = Number(req.params.requestId);

    if (!Number.isInteger(requestId)) {
        return res.status(400).json({
            message: "Identifiant de demande invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "approve_organizer_request",
        {
            p_request_id: requestId
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Demande approuvee avec succes",
        request: data
    });
}


async function rejectOrganizerRequest(req, res) {
    const requestId = Number(req.params.requestId);

    if (!Number.isInteger(requestId)) {
        return res.status(400).json({
            message: "Identifiant de demande invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "reject_organizer_request",
        {
            p_request_id: requestId
        }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: "Demande rejetee avec succes",
        request: data
    });
}





module.exports = {
    createOrganizerRequest,
    getMyOrganizerRequests,
    getAllOrganizerRequests,
    approveOrganizerRequest,
    rejectOrganizerRequest
};