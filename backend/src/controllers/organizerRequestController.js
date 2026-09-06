const {
    validateOrganizerRequestInput
} = require("../validators/organizerDocumentValidator");

/**
 * Enrichit une liste de demandes avec une URL signée temporaire pour chaque justificatif
 * Durée de validité : 3600 secondes (1 heure)
 */
async function enrichRequestsWithSignedUrls(supabase, requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
        return [];
    }

    if (!supabase?.storage?.from) {
        return requests;
    }

    const enriched = await Promise.all(
        requests.map(async (item) => {
            if (!item.document_path) {
                return { ...item, signed_document_url: null };
            }

            try {
                const { data, error } = await supabase.storage
                    .from("organizer-documents")
                    .createSignedUrl(item.document_path, 3600);

                return {
                    ...item,
                    signed_document_url: error ? null : (data?.signedUrl || null)
                };
            } catch (err) {
                return { ...item, signed_document_url: null };
            }
        })
    );

    return enriched;
}

async function createOrganizerRequest(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Utilisateur non authentifie"
        });
    }

    const validation = validateOrganizerRequestInput(req.body, userId);
    if (!validation.isValid) {
        return res.status(400).json({
            message: validation.error
        });
    }

    const { eventType, documentPath, filename } = validation.value;

    // Vérification de la présence réelle du fichier dans le bucket Storage si l'API Storage est disponible
    if (req.supabase?.storage?.from) {
        try {
            const { data: fileList, error: storageError } = await req.supabase.storage
                .from("organizer-documents")
                .list(userId, {
                    search: filename
                });

            if (storageError) {
                return res.status(500).json({
                    message: "Erreur lors de la verification du document dans l'espace de stockage"
                });
            }

            const fileExists = Array.isArray(fileList) && fileList.some((f) => f.name === filename);
            if (!fileExists) {
                return res.status(400).json({
                    message: "Le fichier justificatif est introuvable dans votre espace de stockage"
                });
            }
        } catch (storageErr) {
            return res.status(500).json({
                message: "Service de stockage indisponible"
            });
        }
    }

    const { data, error } = await req.supabase
        .from("organizer_requests")
        .insert({
            user_id: userId,
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

    const enrichedRequests = await enrichRequestsWithSignedUrls(req.supabase, data);

    return res.status(200).json({
        requests: enrichedRequests
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

    const enrichedRequests = await enrichRequestsWithSignedUrls(req.supabase, data);

    return res.status(200).json({
        requests: enrichedRequests
    });
}

async function approveOrganizerRequest(req, res) {
    const requestId = Number(req.params.requestId);

    if (!Number.isInteger(requestId) || requestId <= 0) {
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
    const adminComment = req.body?.adminComment;

    if (!Number.isInteger(requestId) || requestId <= 0) {
        return res.status(400).json({
            message: "Identifiant de demande invalide"
        });
    }

    if (
        adminComment !== undefined &&
        (typeof adminComment !== "string" || adminComment.length > 1000)
    ) {
        return res.status(400).json({
            message: "Le commentaire admin est invalide"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "reject_organizer_request",
        {
            p_request_id: requestId,
            p_admin_comment: adminComment?.trim() || null
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
