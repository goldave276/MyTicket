async function getAdminStats(req, res) {
    const { data: rpcData, error: rpcError } = await req.supabase.rpc("get_admin_stats");

    if (!rpcError && rpcData) {
        return res.status(200).json({
            stats: rpcData
        });
    }

    try {
        const [
            { data: profiles, error: profilesError },
            { data: events, error: eventsError },
            { data: reservations, error: reservationsError },
            { data: tickets, error: ticketsError },
            { data: payments, error: paymentsError }
        ] = await Promise.all([
            req.supabase.from("profiles").select("id, role, is_blocked"),
            req.supabase.from("events").select("id, status"),
            req.supabase.from("reservations").select("id, status, quantity"),
            req.supabase.from("tickets").select("id, status"),
            req.supabase.from("payments").select("id, amount, status").eq("status", "CONFIRMED")
        ]);

        if (profilesError || eventsError || reservationsError || ticketsError || paymentsError) {
            return res.status(500).json({
                message: "Impossible de recuperer les statistiques administratives"
            });
        }

        const userStats = {
            total: (profiles || []).length,
            users: (profiles || []).filter(p => p.role === "USER").length,
            organizers: (profiles || []).filter(p => p.role === "ORGANIZER").length,
            admins: (profiles || []).filter(p => p.role === "ADMIN").length,
            blocked: (profiles || []).filter(p => p.is_blocked).length
        };

        const eventStats = {
            total: (events || []).length,
            draft: (events || []).filter(e => e.status === "DRAFT").length,
            pending: (events || []).filter(e => e.status === "PENDING").length,
            approved: (events || []).filter(e => e.status === "APPROVED").length,
            rejected: (events || []).filter(e => e.status === "REJECTED").length,
            cancelled: (events || []).filter(e => e.status === "CANCELLED").length,
            finished: (events || []).filter(e => e.status === "FINISHED").length
        };

        const reservationStats = {
            total: (reservations || []).length,
            confirmed: (reservations || []).filter(r => r.status === "CONFIRMED").length,
            pending: (reservations || []).filter(r => r.status === "PENDING").length,
            cancelled: (reservations || []).filter(r => r.status === "CANCELLED").length,
            totalQuantitySold: (reservations || [])
                .filter(r => r.status === "CONFIRMED")
                .reduce((sum, r) => sum + (r.quantity || 0), 0)
        };

        const ticketStats = {
            total: (tickets || []).length,
            active: (tickets || []).filter(t => t.status === "ACTIVE").length,
            cancelled: (tickets || []).filter(t => t.status === "CANCELLED").length
        };

        const revenueStats = {
            totalConfirmedRevenue: (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
            currency: "XOF"
        };

        return res.status(200).json({
            stats: {
                users: userStats,
                events: eventStats,
                reservations: reservationStats,
                tickets: ticketStats,
                revenue: revenueStats
            }
        });
    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors du calcul des statistiques"
        });
    }
}

async function getAllUsers(req, res) {
    const { data: rpcUsers, error: rpcError } = await req.supabase.rpc("admin_list_users");

    if (!rpcError && rpcUsers) {
        return res.status(200).json({
            users: rpcUsers
        });
    }

    const { data, error } = await req.supabase
        .from("profiles")
        .select("id, full_name, role, is_blocked, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer la liste des utilisateurs"
        });
    }

    return res.status(200).json({
        users: data
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
