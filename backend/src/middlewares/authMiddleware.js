const {
    supabase,
    createAuthenticatedClient
} = require("../config/supabase");


async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentification requise"
        });
    }

    const token = authorization.replace("Bearer ", "");

    const {
        data: { user },
        error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({
            message: "Token invalide ou expire"
        });
    }

    req.user = user;
    req.supabase = createAuthenticatedClient(token);
    next();
}

module.exports = requireAuth;