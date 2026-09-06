const { z } = require("zod");

const eventPayloadSchema = z.object({
    title: z
        .string({ required_error: "Les informations obligatoires sont manquantes" })
        .trim()
        .min(1, "Les informations obligatoires sont manquantes")
        .min(3, "Le titre doit comporter au moins 3 caracteres")
        .max(150, "Le titre ne doit pas depasser 150 caracteres"),
    description: z
        .string({ required_error: "Les informations obligatoires sont manquantes" })
        .trim()
        .min(1, "Les informations obligatoires sont manquantes")
        .min(10, "La description doit comporter au moins 10 caracteres")
        .max(5000, "La description ne doit pas depasser 5000 caracteres"),
    eventType: z
        .string({ required_error: "Les informations obligatoires sont manquantes" })
        .trim()
        .min(1, "Les informations obligatoires sont manquantes")
        .min(2, "Le type d'evenement doit comporter au moins 2 caracteres")
        .max(80, "Le type d'evenement ne doit pas depasser 80 caracteres"),
    location: z
        .string({ required_error: "Les informations obligatoires sont manquantes" })
        .trim()
        .min(1, "Les informations obligatoires sont manquantes")
        .min(2, "Le lieu doit comporter au moins 2 caracteres")
        .max(200, "Le lieu ne doit pas depasser 200 caracteres"),
    eventDate: z
        .string({ required_error: "Les informations obligatoires sont manquantes" })
        .trim()
        .min(1, "Les informations obligatoires sont manquantes")
        .refine(
            (val) => {
                const parsed = new Date(val);
                return !isNaN(parsed.getTime());
            },
            { message: "La date doit etre valide et future" }
        )
        .refine(
            (val) => {
                const parsed = new Date(val);
                return parsed > new Date();
            },
            { message: "La date doit etre valide et future" }
        ),
    capacity: z
        .number({ required_error: "Les informations obligatoires sont manquantes", invalid_type_error: "La capacite doit etre un entier positif" })
        .int("La capacite doit etre un entier positif")
        .positive("La capacite doit etre un entier positif")
        .max(100000, "La capacite maximale autorisee est de 100 000 places"),
    price: z
        .number({ required_error: "Les informations obligatoires sont manquantes", invalid_type_error: "Le prix doit etre positif ou nul" })
        .min(0, "Le prix doit etre positif ou nul")
        .max(100000000, "Le prix depasse le plafond autorise")
});

function validateEventInput(body) {
    if (!body || typeof body !== "object") {
        return { isValid: false, error: "Corps de requete manquant ou invalide" };
    }

    const {
        title,
        description,
        eventType,
        eventDate,
        location,
        capacity,
        price
    } = body;

    // Vérification rapide des champs obligatoires
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
        return { isValid: false, error: "Les informations obligatoires sont manquantes" };
    }

    const numericCapacity = Number(capacity);
    if (!Number.isFinite(numericCapacity) || !Number.isInteger(numericCapacity) || numericCapacity <= 0) {
        return { isValid: false, error: "La capacite doit etre un entier positif" };
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return { isValid: false, error: "Le prix doit etre positif ou nul" };
    }

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        return { isValid: false, error: "La date doit etre valide et future" };
    }

    const parsed = eventPayloadSchema.safeParse({
        title,
        description,
        eventType,
        eventDate,
        location,
        capacity: numericCapacity,
        price: numericPrice
    });

    if (!parsed.success) {
        return {
            isValid: false,
            error: parsed.error.issues[0]?.message || "Donnees d'evenement invalides",
            issues: parsed.error.issues
        };
    }

    return {
        isValid: true,
        value: {
            title: parsed.data.title,
            description: parsed.data.description,
            eventType: parsed.data.eventType,
            eventDate: parsed.data.eventDate,
            location: parsed.data.location,
            capacity: parsed.data.capacity,
            price: parsed.data.price,
            parsedDate
        }
    };
}

function validateEventId(id) {
    if (id === null || id === undefined || id === "") {
        return { isValid: false, error: "Identifiant d'evenement invalide" };
    }
    const num = Number(id);
    if (!Number.isSafeInteger(num) || num <= 0) {
        return { isValid: false, error: "Identifiant d'evenement invalide" };
    }
    return { isValid: true, value: num };
}

module.exports = {
    eventPayloadSchema,
    validateEventInput,
    validateEventId
};
