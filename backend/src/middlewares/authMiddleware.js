const {
    supabase,
    createAuthenticatedClient
} = require("../config/supabase");

async function requireAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentification requise"
            });
        }

        const token = authorization.replace("Bearer ", "");

        const {
            data: { user } = {},
            error: userError
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({
                message: "Token invalide ou expire"
            });
        }

        req.user = user;
        req.supabase = createAuthenticatedClient(token);

        const { data: profile, error: profileError } = await req.supabase
            .from("profiles")
            .select("is_blocked")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            return res.status(503).json({
                message: "Verification du compte indisponible"
            });
        }

        if (!profile) {
            return res.status(403).json({
                message: "Profil utilisateur introuvable"
            });
        }

        if (profile.is_blocked) {
            return res.status(403).json({
                message: "Compte bloque"
            });
        }

        return next();
    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de la verification de l'authentification"
        });
    }
}

module.exports = requireAuth;
