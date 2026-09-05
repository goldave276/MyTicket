function requireRole(requiredRole) {
    return async (req, res, next) => {
        const { data: profile, error } = await req.supabase
            .from("profiles")
            .select("role")
            .eq("id", req.user.id)
            .single();

        if (error || !profile) {
            return res.status(500).json({
                message: "Impossible de verifier le role"
            });
        }

        if (profile.role !== requiredRole) {
            return res.status(403).json({
                message: "Permission insuffisante"
            });
        }

        req.profile = profile;
        next();
    };
}

module.exports = requireRole;
