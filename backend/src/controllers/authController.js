const { supabase } = require("../config/supabase");
const {
    loginSchema,
    signupSchema,
    passwordResetSchema,
    updateProfileSchema,
    formatZodErrors
} = require("../validators/authValidator");

async function login(req, res) {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            message: "Donnees de connexion invalides",
            errors: formatZodErrors(parseResult.error)
        });
    }

    const { email, password } = parseResult.data;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return res.status(401).json({
            message: "Email ou mot de passe incorrect"
        });
    }

    return res.status(200).json({
        user: data.user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
    });
}

async function signup(req, res) {
    const parseResult = signupSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            message: "Donnees d'inscription invalides",
            errors: formatZodErrors(parseResult.error)
        });
    }

    const { email, password, fullName } = parseResult.data;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || null } }
    });

    if (error) {
        return res.status(400).json({ message: error.message });
    }

    return res.status(201).json({
        user: data.user,
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        confirmationRequired: !data.session
    });
}

async function requestPasswordReset(req, res) {
    const parseResult = passwordResetSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            message: "Email obligatoire et valide",
            errors: formatZodErrors(parseResult.error)
        });
    }

    const { email } = parseResult.data;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL
    });

    if (error) {
        return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
        message: "Si cet email existe, un lien de reinitialisation a ete envoye"
    });
}

async function logout(req, res) {
    const { error } = await req.supabase.auth.signOut();

    if (error) {
        return res.status(400).json({ message: "Impossible de fermer la session" });
    }

    return res.status(204).send();
}

async function updateProfile(req, res) {
    const parseResult = updateProfileSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            message: "Donnees de profil invalides",
            errors: formatZodErrors(parseResult.error)
        });
    }

    const { fullName } = parseResult.data;

    const { data, error } = await req.supabase.rpc("update_my_profile", {
        p_full_name: fullName
    });

    if (error) {
        return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({ profile: data });
}

async function getMe(req, res) {
    const { data: profile, error } = await req.supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .eq("id", req.user.id)
        .single();

    if (error) {
        return res.status(404).json({
            message: "Profil introuvable"
        });
    }

    return res.status(200).json({
        user: req.user,
        profile
    });
}

module.exports = {
    login,
    signup,
    requestPasswordReset,
    logout,
    updateProfile,
    getMe
};
