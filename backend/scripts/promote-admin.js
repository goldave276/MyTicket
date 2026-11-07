require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const email = process.argv[2];

if (!email) {
    console.error("Usage: node scripts/promote-admin.js <email>");
    process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !key) {
    console.error("Erreur: SUPABASE_URL ou clé Supabase manquante dans .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, key);

async function run() {
    console.log(`Promotion de l'utilisateur ${email} au rôle ADMIN...`);

    // Tentative 1: via la fonction RPC promote_user_to_admin
    const { data: rpcData, error: rpcError } = await supabase.rpc("promote_user_to_admin", {
        p_email: email.trim().toLowerCase()
    });

    if (!rpcError && rpcData) {
        console.log(`Succès ! L'utilisateur ${email} est désormais ADMIN.`);
        console.log(rpcData);
        return;
    }

    if (rpcError) {
        console.warn(`RPC error (${rpcError.message}), tentative via table profiles...`);
    }

    // Tentative 2: via recherche dans auth.users si service_role disponible
    const { data: users, error: listError } = await supabase.auth.admin?.listUsers?.();
    if (!listError && users?.users) {
        const found = users.users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
        if (found) {
            const { data: updateData, error: updateError } = await supabase
                .from("profiles")
                .update({ role: "ADMIN" })
                .eq("id", found.id)
                .select()
                .single();

            if (updateError) {
                console.error("Erreur lors de la mise à jour du profil:", updateError.message);
                process.exit(1);
            }

            console.log(`Succès ! Profil mis à jour vers ADMIN pour ${email}:`, updateData);
            return;
        }
    }

    console.error("Impossible de trouver l'utilisateur ou d'appliquer le rôle ADMIN.");
    console.error("Astuce: Appliquez la migration 0016_admin_hierarchical_permissions.sql dans votre console Supabase SQL.");
}

run();
