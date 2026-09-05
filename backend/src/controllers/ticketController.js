async function getMyTickets(req, res) {
    const { data, error } = await req.supabase
        .from("tickets")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            message: "Impossible de recuperer les tickets"
        });
    }

    return res.status(200).json({
        tickets: data
    });
}

module.exports = {
    getMyTickets
};