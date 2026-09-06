async function getUsers(req, res) {
    const { data, error } = await req.supabase.rpc("admin_list_users");
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ users: data });
}

async function updateUserRole(req, res) {
    const { userId } = req.params;
    const { role } = req.body;
    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
        return res.status(400).json({ message: "Identifiant utilisateur invalide" });
    }
    if (!['USER', 'ORGANIZER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: "Role invalide" });
    }
    const { data, error } = await req.supabase.rpc("admin_update_user_role", {
        p_user_id: userId,
        p_role: role
    });
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ user: data });
}

async function setUserBlocked(req, res) {
    const { userId } = req.params;
    const { blocked } = req.body;
    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
        return res.status(400).json({ message: "Identifiant utilisateur invalide" });
    }
    if (typeof blocked !== "boolean") {
        return res.status(400).json({ message: "Le statut blocked doit etre booleen" });
    }
    const { data, error } = await req.supabase.rpc("admin_set_user_blocked", {
        p_user_id: userId,
        p_blocked: blocked
    });
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ user: data });
}

module.exports = { getUsers, updateUserRole, setUserBlocked };
