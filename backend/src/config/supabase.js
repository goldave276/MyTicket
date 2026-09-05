const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Les variables Supabase sont manquantes");
}

const supabase = createClient(
    supabaseUrl,
    supabasePublishableKey
);

function createAuthenticatedClient(accessToken) {
    return createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        }
    );
}

module.exports = {
    supabase,
    createAuthenticatedClient
};