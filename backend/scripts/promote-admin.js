require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const email = process.argv[2];
const customKey = process.argv[3];

if (!email) {
    console.error("Usage: node scripts/promote-admin.js <email> [SUPABASE_SERVICE_ROLE_KEY]");
    process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const key = customKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !key) {
    console.error("Erreur: SUPABASE_URL ou clé Supabase manquante dans .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, key);

async function run() {
    const targetEmail = email.trim().toLowerCase();
    console.log(`\n======================================================`);
    console.log(`Promotion de l'utilisateur : ${targetEmail}`);
    console.log(`Supabase URL : ${supabaseUrl}`);
    console.log(`======================================================\n`);

    // Tentative 1 : via RPC promote_user_to_admin
    const { data: rpcData, error: rpcError } = await supabase.rpc("promote_user_to_admin", {
        p_email: targetEmail
    });

    if (!rpcError && rpcData) {
        console.log(`[SUCCESS] L'utilisateur ${targetEmail} a été promu ADMIN avec succès !`);
        console.log(rpcData);
        return;
    }

    if (rpcError) {
        console.warn(`[INFO] RPC direct non accessible (${rpcError.message}), essai via auth admin...`);
    }

    // Tentative 2 : via service_role si disponible
    if (supabase.auth?.admin?.listUsers) {
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError && users?.users) {
            const found = users.users.find(u => u.email?.toLowerCase() === targetEmail);
            if (found) {
                const { data: updateData, error: updateError } = await supabase
                    .from("profiles")
                    .update({ role: "ADMIN" })
                    .eq("id", found.id)
                    .select()
                    .single();

                if (!updateError && updateData) {
                    console.log(`[SUCCESS] Profil ${targetEmail} mis à jour avec le rôle ADMIN !`);
                    console.log(updateData);
                    return;
                }
            }
        }
    }

    // Si aucune clé service_role n'est injectée, fournir la commande SQL directe prête à l'emploi
    console.log(`\n------------------------------------------------------`);
    console.log(`[ACTION REQUISE DANS SUPABASE SQL EDITOR]`);
    console.log(`Exécutez cette commande dans l'éditeur SQL de votre projet Supabase :`);
    console.log(`\nUPDATE public.profiles SET role = 'ADMIN' WHERE id = (SELECT id FROM auth.users WHERE email = '${targetEmail}');\n`);
    console.log(`------------------------------------------------------\n`);
}

run();
