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
    getMe
};