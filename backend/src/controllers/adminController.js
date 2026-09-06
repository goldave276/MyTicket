async function getAdminStats(req, res) {
    const { data, error } = await req.supabase.rpc("get_admin_stats");

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les statistiques administratives"
        });
    }

    return res.status(200).json({
        stats: data
    });
}

async function getAllUsers(req, res) {
    const { data: rpcUsers, error: rpcError } = await req.supabase.rpc("admin_list_users");

    if (rpcError) {
        return res.status(500).json({
            message: "Impossible de recuperer la liste des utilisateurs"
        });
    }

    return res.status(200).json({
        users: rpcUsers || []
    });
}

async function updateUserRole(req, res) {
    const { userId } = req.params;
    const { role, isBlocked } = req.body;

    if (!userId) {
        return res.status(400).json({
            message: "Identifiant utilisateur obligatoire"
        });
    }

    if (role !== undefined) {
        const allowedRoles = ["USER", "ORGANIZER", "ADMIN"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Role invalide. Les roles autorises sont: USER, ORGANIZER, ADMIN"
            });
        }

        const { data: rpcData, error: rpcError } = await req.supabase.rpc(
            "admin_update_user_role",
            { p_user_id: userId, p_role: role }
        );

        if (rpcError) {
            return res.status(400).json({
                message: rpcError.message
            });
        }

        if (isBlocked === undefined) {
            return res.status(200).json({
                message: "Utilisateur mis a jour avec succes",
                user: rpcData
            });
        }
    }

    if (isBlocked !== undefined) {
        if (typeof isBlocked !== "boolean") {
            return res.status(400).json({
                message: "isBlocked doit etre un booleen"
            });
        }

        const { data: rpcBlockData, error: rpcBlockError } = await req.supabase.rpc(
            "admin_set_user_blocked",
            { p_user_id: userId, p_blocked: isBlocked }
        );

        if (rpcBlockError) {
            return res.status(400).json({
                message: rpcBlockError.message
            });
        }

        return res.status(200).json({
            message: isBlocked ? "Utilisateur bloque" : "Utilisateur debloque",
            user: rpcBlockData
        });
    }

    return res.status(400).json({
        message: "Aucune modification fournie"
    });
}

async function setUserBlocked(req, res) {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    if (!userId) {
        return res.status(400).json({
            message: "Identifiant utilisateur obligatoire"
        });
    }

    if (typeof isBlocked !== "boolean") {
        return res.status(400).json({
            message: "isBlocked doit etre un booleen"
        });
    }

    const { data, error } = await req.supabase.rpc(
        "admin_set_user_blocked",
        { p_user_id: userId, p_blocked: isBlocked }
    );

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: isBlocked ? "Utilisateur bloque" : "Utilisateur debloque",
        user: data
    });
}

module.exports = {
    getAdminStats,
    getAllUsers,
    getUsers: getAllUsers,
    updateUserRole,
    setUserBlocked
};
