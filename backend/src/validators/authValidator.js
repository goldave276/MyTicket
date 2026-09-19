const { z } = require("zod");

const emailSchema = z
    .string({ required_error: "Email obligatoire" })
    .trim()
    .toLowerCase()
    .email({ message: "Format d'email invalide" })
    .max(254, { message: "L'email ne peut pas depasser 254 caracteres" });

const loginSchema = z.object({
    email: emailSchema,
    password: z
        .string({ required_error: "Mot de passe obligatoire" })
        .min(1, { message: "Mot de passe obligatoire" })
});

const signupSchema = z.object({
    email: emailSchema,
    password: z
        .string({ required_error: "Mot de passe obligatoire" })
        .min(8, { message: "Le mot de passe doit contenir au moins 8 caracteres" })
        .max(100, { message: "Le mot de passe ne peut pas depasser 100 caracteres" })
        .regex(/[A-Za-z]/, { message: "Le mot de passe doit contenir au moins une lettre" })
        .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" }),
    fullName: z
        .string()
        .trim()
        .min(2, { message: "Le nom complet doit contenir au moins 2 caracteres" })
        .max(100, { message: "Le nom complet ne peut pas depasser 100 caracteres" })
        .optional()
        .or(z.literal(""))
});

const passwordResetSchema = z.object({
    email: emailSchema
});

const updateProfileSchema = z.object({
    fullName: z
        .string({ required_error: "Le nom complet est obligatoire" })
        .trim()
        .min(2, { message: "Le nom complet doit contenir au moins 2 caracteres" })
        .max(100, { message: "Le nom complet ne peut pas depasser 100 caracteres" })
});

function formatZodErrors(error) {
    const errors = {};
    if (error && error.issues) {
        for (const issue of error.issues) {
            const field = issue.path.join(".") || "error";
            errors[field] = issue.message;
        }
    }
    return errors;
}

module.exports = {
    loginSchema,
    signupSchema,
    passwordResetSchema,
    updateProfileSchema,
    formatZodErrors
};
