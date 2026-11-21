const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const DEFAULT_TABLES = [
    "profiles",
    "organizer_requests",
    "events",
    "reservations",
    "tickets",
    "payments"
];

/**
 * Exporte l'ensemble des tables de la base Supabase sous forme de snapshot JSON structuré.
 * @param {Object} options
 * @param {string} [options.supabaseUrl]
 * @param {string} [options.supabaseKey]
 * @param {string[]} [options.tables]
 * @param {string} [options.outputDir]
 * @param {Object} [options.client] - Client Supabase mocké pour les tests
 * @returns {Promise<{ filePath: string, summary: Object, checksum: string }>}
 */
async function exportDatabaseBackup(options = {}) {
    const supabaseUrl = options.supabaseUrl !== undefined ? options.supabaseUrl : process.env.SUPABASE_URL;
    const supabaseKey = options.supabaseKey !== undefined ? options.supabaseKey : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY);
    const tables = options.tables || DEFAULT_TABLES;
    const outputDir = options.outputDir || path.resolve(__dirname, "../backups");

    if (!options.client && (!supabaseUrl || !supabaseKey)) {
        throw new Error("SUPABASE_URL et clé Supabase nécessaires pour exécuter la sauvegarde.");
    }

    const client = options.client || createClient(supabaseUrl, supabaseKey);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const exportedAt = new Date().toISOString();
    const backupData = {
        version: "1.0.0",
        exportedAt,
        tables: {},
        summary: {}
    };

    for (const table of tables) {
        const { data, error } = await client.from(table).select("*");
        if (error) {
            console.warn(`[WARN] Erreur lors de la lecture de la table '${table}': ${error.message}`);
            backupData.tables[table] = [];
            backupData.summary[table] = { count: 0, status: "ERROR", error: error.message };
        } else {
            backupData.tables[table] = data || [];
            backupData.summary[table] = { count: (data || []).length, status: "OK" };
        }
    }

    // Calcul du hash d'intégrité SHA-256 du contenu des tables
    const contentToHash = JSON.stringify(backupData.tables);
    const checksum = crypto.createHash("sha256").update(contentToHash).digest("hex");
    backupData.checksum = checksum;

    const datePrefix = exportedAt.replace(/[:.]/g, "-");
    const fileName = `myticket_backup_${datePrefix}.json`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf-8");

    return { filePath, summary: backupData.summary, checksum };
}

// Exécution CLI directe
if (require.main === module) {
    (async () => {
        try {
            console.log("\n========================================================");
            console.log("📦 Démarrage de la sauvegarde logique Supabase (MyTicket)");
            console.log("========================================================\n");

            const result = await exportDatabaseBackup();

            console.log(`[SUCCESS] Sauvegarde terminée avec succès !`);
            console.log(`📁 Fichier : ${result.filePath}`);
            console.log(`🔒 Empreinte SHA-256 : ${result.checksum}\n`);
            console.log("Récapitulatif des données exportées :");
            console.table(result.summary);
            process.exit(0);
        } catch (err) {
            console.error(`\n[FATAL] Échec de la sauvegarde : ${err.message}`);
            process.exit(1);
        }
    })();
}

module.exports = {
    exportDatabaseBackup,
    DEFAULT_TABLES
};
