const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Les variables Supabase sont manquantes");
}

const STATELESS_AUTH_OPTIONS = {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
};

const supabase = createClient(
    supabaseUrl,
    supabasePublishableKey,
    STATELESS_AUTH_OPTIONS
);

const supabaseService = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, STATELESS_AUTH_OPTIONS)
    : supabase;

function createAuthenticatedClient(accessToken) {
    return createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            ...STATELESS_AUTH_OPTIONS,
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
    supabaseService,
    createAuthenticatedClient
};
