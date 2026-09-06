const ALLOWED_KEYS = new Set([
    "search",
    "eventType",
    "location",
    "dateFrom",
    "dateTo",
    "minPrice",
    "maxPrice",
    "page",
    "limit"
]);

function sanitizeString(val, maxLength) {
    if (typeof val !== "string") return null;
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    if (trimmed.length > maxLength) return null;
    return trimmed;
}

function parseNonNegativeNumber(val) {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val === "object") return null;
    const num = Number(val);
    if (!Number.isFinite(num) || Number.isNaN(num) || num < 0) {
        return null;
    }
    return num;
}

function parsePositiveInteger(val, defaultVal, minVal, maxVal) {
    if (val === undefined || val === null || val === "") return defaultVal;
    const num = Number(val);
    if (!Number.isInteger(num) || num < minVal || (maxVal !== undefined && num > maxVal)) {
        return null;
    }
    return num;
}

function parseIsoDate(val) {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val !== "string") return null;
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
}

function escapePostgrestValue(str) {
    if (!str) return "";
    return str.replace(/[,().%:\\]/g, "");
}

function validateEventQuery(query = {}) {
    const errors = {};
    const normalized = {};

    for (const key of Object.keys(query)) {
        if (!ALLOWED_KEYS.has(key)) {
            errors[key] = `Parametre non autorise: ${key}`;
        }
    }

    if (query.search !== undefined) {
        const sanitized = sanitizeString(query.search, 100);
        if (sanitized === null) {
            errors.search = "Le terme de recherche doit etre une chaine de 1 a 100 caracteres";
        } else if (sanitized !== undefined) {
            normalized.search = sanitized;
        }
    }

    if (query.eventType !== undefined) {
        const sanitized = sanitizeString(query.eventType, 80);
        if (sanitized === null) {
            errors.eventType = "Le type d'evenement doit etre une chaine de 1 a 80 caracteres";
        } else if (sanitized !== undefined) {
            normalized.eventType = sanitized;
        }
    }

    if (query.location !== undefined) {
        const sanitized = sanitizeString(query.location, 120);
        if (sanitized === null) {
            errors.location = "Le lieu doit etre une chaine de 1 a 120 caracteres";
        } else if (sanitized !== undefined) {
            normalized.location = sanitized;
        }
    }

    if (query.minPrice !== undefined) {
        const parsed = parseNonNegativeNumber(query.minPrice);
        if (parsed === null) {
            errors.minPrice = "Le prix minimum doit etre un nombre positif ou nul";
        } else if (parsed !== undefined) {
            normalized.minPrice = parsed;
        }
    }

    if (query.maxPrice !== undefined) {
        const parsed = parseNonNegativeNumber(query.maxPrice);
        if (parsed === null) {
            errors.maxPrice = "Le prix maximum doit etre un nombre positif ou nul";
        } else if (parsed !== undefined) {
            normalized.maxPrice = parsed;
        }
    }

    if (normalized.minPrice !== undefined && normalized.maxPrice !== undefined) {
        if (normalized.minPrice > normalized.maxPrice) {
            errors.minPrice = "Le prix minimum ne peut pas etre superieur au prix maximum";
        }
    }

    if (query.dateFrom !== undefined) {
        const parsed = parseIsoDate(query.dateFrom);
        if (parsed === null) {
            errors.dateFrom = "La date de debut doit etre une date ISO valide";
        } else if (parsed !== undefined) {
            normalized.dateFrom = parsed;
        }
    }

    if (query.dateTo !== undefined) {
        const parsed = parseIsoDate(query.dateTo);
        if (parsed === null) {
            errors.dateTo = "La date de fin doit etre une date ISO valide";
        } else if (parsed !== undefined) {
            normalized.dateTo = parsed;
        }
    }

    if (normalized.dateFrom && normalized.dateTo) {
        if (new Date(normalized.dateFrom) > new Date(normalized.dateTo)) {
            errors.dateFrom = "La date de debut ne peut pas etre posterieure a la date de fin";
        }
    }

    const parsedPage = parsePositiveInteger(query.page, 1, 1);
    if (parsedPage === null) {
        errors.page = "Le numero de page doit etre un entier superieur ou egal a 1";
    } else {
        normalized.page = parsedPage;
    }

    const parsedLimit = parsePositiveInteger(query.limit, 20, 1, 50);
    if (parsedLimit === null) {
        errors.limit = "La limite doit etre un entier compris entre 1 et 50";
    } else {
        normalized.limit = parsedLimit;
    }

    if (Object.keys(errors).length > 0) {
        return {
            isValid: false,
            errors
        };
    }

    return {
        isValid: true,
        value: normalized
    };
}

module.exports = {
    validateEventQuery,
    escapePostgrestValue
};
