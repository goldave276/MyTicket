function requireRole(requiredRole) {
    const roles = (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).map(r => String(r).trim().toUpperCase());

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
