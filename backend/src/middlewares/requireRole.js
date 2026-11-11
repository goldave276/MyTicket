function requireRole(requiredRole) {
    const roles = (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).map(r => String(r).trim().toUpperCase());

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

        const userRole = (profile.role || "").trim().toUpperCase();

        // Hiérarchie RBAC : un administrateur (ADMIN) dispose de tous les droits et privilèges
        // sur les rôles subordonnés (ORGANIZER, USER).
        if (userRole !== "ADMIN" && !roles.includes(userRole)) {
            return res.status(403).json({
                message: "Permission insuffisante"
            });
        }

        req.profile = { ...profile, role: userRole };
        next();
    };
}

module.exports = requireRole;
