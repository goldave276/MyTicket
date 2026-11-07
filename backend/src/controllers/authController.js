const { supabase } = require("../config/supabase");
const {
    loginSchema,
    signupSchema,
    passwordResetSchema,
    updateProfileSchema,
    refreshTokenSchema,
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

    // Récupération du profil applicatif pour hydrater le vrai rôle (USER, ORGANIZER, ADMIN)
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_blocked, created_at")
        .eq("id", data.user.id)
        .maybeSingle();

    if (profile?.is_blocked) {
        return res.status(403).json({
            message: "Compte bloque"
        });
    }

    const appUser = {
        ...data.user,
        role: profile?.role || "USER",
        full_name: profile?.full_name || data.user.user_metadata?.full_name || null,
        is_blocked: profile?.is_blocked || false
    };

    return res.status(200).json({
        user: appUser,
        profile: profile || null,
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

    const appUser = {
        ...data.user,
        role: "USER",
        full_name: fullName || null,
        is_blocked: false
    };

    return res.status(201).json({
        user: appUser,
        profile: {
            id: data.user.id,
            full_name: fullName || null,
            role: "USER",
            is_blocked: false
        },
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
        // Enregistrer l'erreur en interne pour le suivi, tout en gardant une reponse generique anti-enumeration
        console.error("Password reset error:", error.message);
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
        .select("id, full_name, role, is_blocked, created_at")
        .eq("id", req.user.id)
        .single();

    if (error) {
        return res.status(404).json({
            message: "Profil introuvable"
        });
    }

    const appUser = {
        ...req.user,
        role: profile.role,
        full_name: profile.full_name,
        is_blocked: profile.is_blocked || false
    };

    return res.status(200).json({
        user: appUser,
        profile
    });
}

async function refreshSession(req, res) {
    const parseResult = refreshTokenSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            message: "Donnees de rafraichissement invalides",
            errors: formatZodErrors(parseResult.error)
        });
    }

    const { refreshToken } = parseResult.data;

    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
    });

    if (error || !data?.session) {
        return res.status(401).json({ message: "Session invalide ou expiree" });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_blocked, created_at")
        .eq("id", data.user.id)
        .maybeSingle();

    const appUser = {
        ...data.user,
        role: profile?.role || "USER",
        full_name: profile?.full_name || data.user.user_metadata?.full_name || null,
        is_blocked: profile?.is_blocked || false
    };

    return res.status(200).json({
        user: appUser,
        profile: profile || null,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
    });
}

module.exports = {
    login,
    signup,
    requestPasswordReset,
    logout,
    updateProfile,
    getMe,
    refreshSession
};
