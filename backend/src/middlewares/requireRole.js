function requireRole(requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    return async (req, res, next) => {
        let profile = req.profile;
        if (!profile || !profile.role) {
            const { data, error } = await req.supabase
                .from("profiles")
                .select("id, role")
                .eq("id", req.user.id)
                .single();

            if (error || !data) {
                return res.status(500).json({
                    message: "Impossible de verifier le role"
                });
            }
            profile = data;
            req.profile = profile;
        }

        // Hiérarchie RBAC : un administrateur (ADMIN) dispose de tous les droits et privilèges
        // sur les rôles subordonnés (ORGANIZER, USER).
        if (profile.role !== "ADMIN" && !roles.includes(profile.role)) {
            return res.status(403).json({
                message: "Permission insuffisante"
            });
        }

        next();
    };
}

module.exports = requireRole;
