require("dotenv").config();

const {
    validateOrganizerDocumentPath,
    validateOrganizerRequestInput
} = require("../validators/organizerDocumentValidator");

const {
    createOrganizerRequest,
    getMyOrganizerRequests,
    getAllOrganizerRequests,
    approveOrganizerRequest,
    rejectOrganizerRequest
} = require("../controllers/organizerRequestController");

function createResponse() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

describe("Validateur de Justificatifs Organisateur (organizerDocumentValidator)", () => {
    const validUserId = "123e4567-e89b-12d3-a456-426614174000";
    const otherUserId = "987e6543-e21b-43d2-b654-321098765000";

    it("accepte un chemin valide au format <userId>/<nom-fichier> avec extensions autorisees", () => {
        const extensions = ["pdf", "jpg", "jpeg", "png", "webp", "PDF", "PNG"];
        for (const ext of extensions) {
            const path = `${validUserId}/registre_commerce.${ext}`;
            const result = validateOrganizerDocumentPath(path, validUserId);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedPath).toBe(path);
            expect(result.filename).toBe(`registre_commerce.${ext}`);
        }
    });

    it("refuse un chemin appartenant a un autre utilisateur", () => {
        const path = `${otherUserId}/justificatif.pdf`;
        const result = validateOrganizerDocumentPath(path, validUserId);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("dossier personnel");
    });

    it("refuse les tentatives de path traversal (..)", () => {
        const badPaths = [
            `../${validUserId}/doc.pdf`,
            `${validUserId}/../secret.pdf`,
            `${validUserId}/../../etc/passwd.pdf`
        ];
        for (const p of badPaths) {
            const result = validateOrganizerDocumentPath(p, validUserId);
            expect(result.isValid).toBe(false);
        }
    });

    it("refuse les slashs initiaux, anti-slashs et sous-repertoires", () => {
        const badPaths = [
            `/${validUserId}/doc.pdf`,
            `${validUserId}\\doc.pdf`,
            `${validUserId}/sous-dossier/doc.pdf`,
            `${validUserId}/`
        ];
        for (const p of badPaths) {
            const result = validateOrganizerDocumentPath(p, validUserId);
            expect(result.isValid).toBe(false);
        }
    });

    it("refuse les URLs completes (http, https)", () => {
        const badUrls = [
            `https://storage.supabase.co/${validUserId}/doc.pdf`,
            `http://malicious.site/${validUserId}/doc.pdf`
        ];
        for (const u of badUrls) {
            const result = validateOrganizerDocumentPath(u, validUserId);
            expect(result.isValid).toBe(false);
        }
    });

    it("refuse les extensions dangereuses ou non autorisees", () => {
        const forbiddenExts = ["exe", "js", "sh", "php", "html", "svg", "zip"];
        for (const ext of forbiddenExts) {
            const path = `${validUserId}/piece_jointe.${ext}`;
            const result = validateOrganizerDocumentPath(path, validUserId);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("Extension non autorisee");
        }
    });

    it("valide l'ensemble du payload de creation de demande", () => {
        const validBody = {
            eventType: "FESTIVAL",
            documentPath: `${validUserId}/kbis.pdf`
        };
        const validation = validateOrganizerRequestInput(validBody, validUserId);
        expect(validation.isValid).toBe(true);
        expect(validation.value.eventType).toBe("FESTIVAL");

        const invalidEventType = {
            eventType: "",
            documentPath: `${validUserId}/kbis.pdf`
        };
        expect(validateOrganizerRequestInput(invalidEventType, validUserId).isValid).toBe(false);
    });
});

describe("Contrôleur de Demandes Organisateur durci (organizerRequestController)", () => {
    const validUserId = "123e4567-e89b-12d3-a456-426614174000";

    it("rejette la creation si le fichier est introuvable dans le bucket Storage", async () => {
        const response = createResponse();
        const fakeSupabase = {
            storage: {
                from: (bucket) => {
                    expect(bucket).toBe("organizer-documents");
                    return {
                        list: async (folder, options) => {
                            expect(folder).toBe(validUserId);
                            // Simuler un fichier absent
                            return { data: [], error: null };
                        }
                    };
                }
            }
        };

        const req = {
            user: { id: validUserId },
            body: {
                eventType: "CONCERT",
                documentPath: `${validUserId}/mon_document.pdf`
            },
            supabase: fakeSupabase
        };

        await createOrganizerRequest(req, response);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("introuvable dans votre espace de stockage");
    });

    it("accepte la creation lorsque le fichier est present dans le bucket Storage", async () => {
        const response = createResponse();
        let insertedData = null;

        const fakeSupabase = {
            storage: {
                from: (bucket) => ({
                    list: async (folder, options) => {
                        return {
                            data: [{ name: "mon_document.pdf" }],
                            error: null
                        };
                    }
                })
            },
            from: (table) => {
                expect(table).toBe("organizer_requests");
                return {
                    insert: (data) => {
                        insertedData = data;
                        return {
                            select: () => ({
                                single: async () => ({
                                    data: { id: 1, ...data, status: "PENDING" },
                                    error: null
                                })
                            })
                        };
                    }
                };
            }
        };

        const req = {
            user: { id: validUserId },
            body: {
                eventType: "CONCERT",
                documentPath: `${validUserId}/mon_document.pdf`
            },
            supabase: fakeSupabase
        };

        await createOrganizerRequest(req, response);

        expect(response.statusCode).toBe(201);
        expect(insertedData.user_id).toBe(validUserId);
        expect(insertedData.document_path).toBe(`${validUserId}/mon_document.pdf`);
    });

    it("enrichit les demandes avec une URL signee temporaire lors de la consultation", async () => {
        const response = createResponse();
        const fakeSupabase = {
            storage: {
                from: (bucket) => ({
                    createSignedUrl: async (path, expiresIn) => {
                        expect(bucket).toBe("organizer-documents");
                        expect(expiresIn).toBe(3600);
                        return {
                            data: { signedUrl: `https://storage.signed.url/${path}?token=abc` },
                            error: null
                        };
                    }
                })
            },
            from: (table) => ({
                select: () => ({
                    eq: () => ({
                        order: async () => ({
                            data: [
                                {
                                    id: 1,
                                    user_id: validUserId,
                                    event_type: "CONCERT",
                                    document_path: `${validUserId}/doc.pdf`
                                }
                            ],
                            error: null
                        })
                    }),
                    order: async () => ({
                        data: [
                            {
                                id: 1,
                                user_id: validUserId,
                                event_type: "CONCERT",
                                document_path: `${validUserId}/doc.pdf`
                            }
                        ],
                        error: null
                    })
                })
            })
        };

        const req = {
            user: { id: validUserId },
            supabase: fakeSupabase
        };

        await getMyOrganizerRequests(req, response);

        expect(response.statusCode).toBe(200);
        expect(response.body.requests[0].signed_document_url).toContain("https://storage.signed.url");
    });

    it("refuse un identifiant invalide (non-entier ou <= 0) pour approbation et rejet", async () => {
        const resp1 = createResponse();
        await approveOrganizerRequest({ params: { requestId: "0" }, supabase: {} }, resp1);
        expect(resp1.statusCode).toBe(400);

        const resp2 = createResponse();
        await rejectOrganizerRequest({ params: { requestId: "-5" }, supabase: {} }, resp2);
        expect(resp2.statusCode).toBe(400);
    });
});
