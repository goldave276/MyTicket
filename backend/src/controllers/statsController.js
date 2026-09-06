async function getOrganizerStats(req, res) {
    const { data, error } = await req.supabase.rpc("get_organizer_stats");

    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ stats: data });
}

async function getAdminStats(req, res) {
    const { data, error } = await req.supabase.rpc("get_admin_stats");

    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ stats: data });
}

module.exports = { getOrganizerStats, getAdminStats };
