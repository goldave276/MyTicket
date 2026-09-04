const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Les variables Supabase sont manquantes");
}

const supabase = createClient(supabaseUrl, supabasePublishableKey);

module.exports = supabase;