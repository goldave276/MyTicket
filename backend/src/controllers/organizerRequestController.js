const {
    validateOrganizerRequestInput,
    validateOrganizerUploadedFile
} = require("../validators/organizerDocumentValidator");
const { supabaseService } = require("../config/supabase");
const { sendOrganizerRequestNotificationEmail } = require("../services/emailService");

/**
 * Enrichit une liste de demandes avec une URL signée temporaire pour chaque justificatif
 * Durée de validité : 3600 secondes (1 heure)
 */
async function enrichRequestsWithSignedUrls(supabase, requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
        return [];
    }

    const storageClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseService?.storage?.from)
        ? supabaseService.storage
        : supabase?.storage;

    if (!storageClient?.from) {
        return requests;
    }

    const enriched = await Promise.all(
        requests.map(async (item) => {
            if (!item.document_path) {
                return { ...item, signed_document_url: null };
            }

            try {
                const { data, error } = await storageClient
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

    let finalDocumentPath = req.body?.documentPath;

    // Si un fichier est téléversé directement (file: { filename, mimeType, base64Data })
    if (req.body?.file) {
        const fileValidation = validateOrganizerUploadedFile(req.body.file);
        if (!fileValidation.isValid) {
            return res.status(400).json({
                message: fileValidation.error
            });
        }

        // Nom unique pour éviter les collisions : <timestamp>_<filename>
        const timestamp = Date.now();
        const safeFilename = `${timestamp}_${fileValidation.filename}`;
        const targetPath = `${userId}/${safeFilename}`;

        const storageClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseService?.storage?.from)
            ? supabaseService.storage
            : req.supabase?.storage;

        if (storageClient?.from) {
            try {
                let { error: uploadError } = await storageClient
                    .from("organizer-documents")
                    .upload(targetPath, fileValidation.buffer, {
                        contentType: fileValidation.mimeType,
                        upsert: true
                    });

                // Si le bucket n'existe pas, tentative d'auto-création avec supabaseService puis nouvel essai
                if (uploadError && (uploadError.message?.toLowerCase().includes("not found") || uploadError.statusCode === "404" || uploadError.status === 404)) {
                    if (supabaseService?.storage?.createBucket) {
                        try {
                            await supabaseService.storage.createBucket("organizer-documents", { public: false });
                            const retry = await storageClient
                                .from("organizer-documents")
                                .upload(targetPath, fileValidation.buffer, {
                                    contentType: fileValidation.mimeType,
                                    upsert: true
                                });
                            uploadError = retry.error;
                        } catch (bucketErr) {
                            console.error("[organizerRequestController] Erreur creation bucket:", bucketErr);
                        }
                    }
                }

                if (uploadError) {
                    console.error("[organizerRequestController] Erreur upload storage:", uploadError);
                    return res.status(500).json({
                        message: `Echec du televersement du document dans le stockage (${uploadError.message || "erreur inconnue"})`
                    });
                }

                finalDocumentPath = targetPath;
            } catch (err) {
                console.error("[organizerRequestController] Exception upload storage:", err);
                return res.status(500).json({
                    message: "Erreur service lors du televersement du document"
                });
            }
        } else {
            finalDocumentPath = targetPath;
        }
    }

    const validation = validateOrganizerRequestInput({ ...req.body, documentPath: finalDocumentPath }, userId);
    if (!validation.isValid) {
        return res.status(400).json({
            message: validation.error
        });
    }

    const { eventType, description, documentPath, filename } = validation.value;

    // Si aucun nouveau fichier n'a été uploadé dans cette requête (chemin préexistant), vérifier sa présence
    const checkClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseService?.storage?.from)
        ? supabaseService.storage
        : req.supabase?.storage;

    if (!req.body?.file && checkClient?.from) {
        try {
            const { data: fileList, error: storageError } = await checkClient
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
            description,
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

    // Notification administrative par email asynchrone (non bloquante pour le client)
    sendOrganizerRequestNotificationEmail({
        applicantName: req.profile?.full_name || req.user?.user_metadata?.full_name || req.user?.email,
        applicantEmail: req.user?.email,
        eventType,
        description
    }).catch((notifErr) => {
        console.error("[organizerRequestController] Erreur envoi alerte admin:", notifErr);
    });

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
    const adminComment = req.body?.adminComment ?? req.body?.reason;

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
