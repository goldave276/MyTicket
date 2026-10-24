// Environnement de test deterministe, charge par Vitest (setupFiles) avant
// chaque fichier de test, donc avant require("../App") et dotenv.
// dotenv n'ecrase jamais une variable deja definie : les valeurs ci-dessous
// priment sur le .env local du developpeur.

process.env.NODE_ENV = "test";

// Origine officielle du frontend en developpement (frontend/package.json, port 3333).
process.env.FRONTEND_URL = "http://localhost:3333";

// Valeurs factices uniquement si absentes (machine sans .env, CI) :
// config/supabase.js refuse de demarrer sans ces variables.
if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = "https://test-project.supabase.co";
}
if (!process.env.SUPABASE_PUBLISHABLE_KEY) {
    process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
}
