const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const MAX_PATH_LENGTH = 500;
const MAX_EVENT_TYPE_LENGTH = 50;
const MIN_EVENT_TYPE_LENGTH = 2;

/**
 * Valide le chemin du document de justificatif organisateur
 * Doit strictement respecter le format : <userId>/<filename>
 * 
 * @param {string} documentPath - Le chemin fourni
 * @param {string} userId - L'UUID de l'utilisateur connecte
 * @returns {{ isValid: boolean, error?: string, sanitizedPath?: string, filename?: string }}
 */
function validateOrganizerDocumentPath(documentPath, userId) {
    if (!documentPath || typeof documentPath !== "string") {
        return { isValid: false, error: "Le chemin du document est obligatoire" };
    }

    if (!userId || typeof userId !== "string") {
        return { isValid: false, error: "Identifiant utilisateur requis pour valider le document" };
    }

    const trimmedPath = documentPath.trim();

    if (trimmedPath.length > MAX_PATH_LENGTH) {
        return {
            isValid: false,
            error: `Le chemin du document ne doit pas depasser ${MAX_PATH_LENGTH} caracteres`
        };
    }

    // Interdire les tentatives de traversée de répertoire, anti-slashs, slashs initiaux, protocoles URLs
    if (
        trimmedPath.startsWith("/") ||
        trimmedPath.includes("\\") ||
        trimmedPath.includes("..") ||
        trimmedPath.includes("://") ||
        trimmedPath.startsWith("http:") ||
        trimmedPath.startsWith("https:")
    ) {
        return {
            isValid: false,
            error: "Format de chemin de document non autorise (traversée ou URL interdite)"
        };
    }

    const expectedPrefix = `${userId}/`;
    if (!trimmedPath.startsWith(expectedPrefix)) {
        return {
            isValid: false,
            error: "Le document doit imperativement se trouver dans le dossier personnel de l'utilisateur"
        };
    }

    const filename = trimmedPath.slice(expectedPrefix.length);
    if (!filename || filename.includes("/")) {
        return {
            isValid: false,
            error: "Nom de fichier de document invalide ou sous-dossier non autorise"
        };
    }

    // Caracteres autorises pour le nom de fichier
    const validFilenameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validFilenameRegex.test(filename)) {
        return {
            isValid: false,
            error: "Le nom du fichier contient des caracteres non autorises"
        };
    }

    // Validation de l'extension
    const lowerFilename = filename.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
    if (!hasValidExt) {
        return {
            isValid: false,
            error: `Extension non autorisee. Extensions acceptees : ${ALLOWED_EXTENSIONS.join(", ")}`
        };
    }

    return {
        isValid: true,
        sanitizedPath: trimmedPath,
        filename
    };
}

/**
 * Valide l'ensemble du payload pour la creation d'une demande organisateur
 * 
 * @param {object} body - Corps de requete
 * @param {string} userId - UUID de l'utilisateur connecte
 * @returns {{ isValid: boolean, error?: string, value?: { eventType: string, documentPath: string, filename: string } }}
 */
function validateOrganizerRequestInput(body, userId) {
    if (!body || typeof body !== "object") {
        return { isValid: false, error: "Corps de requete manquant ou invalide" };
    }

    const { eventType, documentPath } = body;

    if (!eventType || typeof eventType !== "string" || !eventType.trim()) {
        return { isValid: false, error: "Le type d'evenement et le document sont obligatoires" };
    }

    const trimmedEventType = eventType.trim();
    if (trimmedEventType.length < MIN_EVENT_TYPE_LENGTH || trimmedEventType.length > MAX_EVENT_TYPE_LENGTH) {
        return {
            isValid: false,
            error: `Le type d'evenement doit comporter entre ${MIN_EVENT_TYPE_LENGTH} et ${MAX_EVENT_TYPE_LENGTH} caracteres`
        };
    }

    const docValidation = validateOrganizerDocumentPath(documentPath, userId);
    if (!docValidation.isValid) {
        return { isValid: false, error: docValidation.error };
    }

    return {
        isValid: true,
        value: {
            eventType: trimmedEventType,
            documentPath: docValidation.sanitizedPath,
            filename: docValidation.filename
        }
    };
}

module.exports = {
    ALLOWED_EXTENSIONS,
    MAX_PATH_LENGTH,
    validateOrganizerDocumentPath,
    validateOrganizerRequestInput
};
