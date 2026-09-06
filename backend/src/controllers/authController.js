const { supabase } = require("../config/supabase");

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email et mot de passe obligatoires"
        });
    }

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
    const { email, password, fullName } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email et mot de passe obligatoires"
        });
    }

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
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email obligatoire" });
    }

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
    const { fullName } = req.body;

    if (typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({ message: "Le nom complet est obligatoire" });
    }

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
