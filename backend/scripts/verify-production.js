/**
 * Script de vérification de l'environnement de production (Health & Sanity Check)
 * Usage: node scripts/verify-production.js
 */

const https = require("https");
const { URL } = require("url");

const CHECKS = [
    {
        name: "Backend Render - Endpoint de Santé",
        url: "https://myticket-llwf.onrender.com/api/health",
        expectedStatus: 200,
        validateBody: (body) => {
            try {
                const json = JSON.parse(body);
                return json.message === "API MyTicket operationnelle" || json.status === "ok";
            } catch {
                return false;
            }
        }
    },
    {
        name: "Backend Render - Catalogue Public",
        url: "https://myticket-llwf.onrender.com/api/events/approved?limit=5",
        expectedStatus: 200,
        validateBody: (body) => {
            try {
                const json = JSON.parse(body);
                return Array.isArray(json.events) || Array.isArray(json.data) || Array.isArray(json);
            } catch {
                return false;
            }
        }
    },
    {
        name: "Frontend Vercel - Page d'Accueil",
        url: "https://my-ticket-virid.vercel.app",
        expectedStatus: 200,
        validateBody: (body) => body.includes("MyTicket") || body.includes("__next") || body.includes("<!DOCTYPE html>")
    }
];

function fetchEndpoint(urlStr, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const parsedUrl = new URL(urlStr);

        const req = https.get(parsedUrl, {
            headers: {
                "User-Agent": "MyTicket-Production-Verifier/1.0"
            },
            timeout: timeoutMs
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                const durationMs = Date.now() - start;
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    durationMs
                });
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.on("timeout", () => {
            req.destroy();
            reject(new Error(`Timeout après ${timeoutMs}ms`));
        });
    });
}

async function runProductionSanityCheck() {
    console.log("\n=======================================================");
    console.log("🔍 Contrôle de l'Environnement de Production (MyTicket)");
    console.log("=======================================================\n");

    const results = [];
    let allPassed = true;

    for (const check of CHECKS) {
        process.stdout.write(`Contrôle : ${check.name} ... `);
        try {
            const res = await fetchEndpoint(check.url);
            const statusOk = res.statusCode === check.expectedStatus;
            const bodyOk = check.validateBody ? check.validateBody(res.body) : true;
            const passed = statusOk && bodyOk;

            if (!passed) allPassed = false;

            results.push({
                Cible: check.name,
                Statut: passed ? "✅ OK" : "❌ ÉCHEC",
                HTTP: res.statusCode,
                "Temps (ms)": `${res.durationMs} ms`
            });
            console.log(passed ? `OK (${res.durationMs}ms)` : `ÉCHEC (HTTP ${res.statusCode})`);
        } catch (err) {
            allPassed = false;
            results.push({
                Cible: check.name,
                Statut: "❌ ERREUR",
                HTTP: "N/A",
                "Temps (ms)": err.message
            });
            console.log(`ERREUR : ${err.message}`);
        }
    }

    console.log("\nTableau de synthèse :");
    console.table(results);

    if (allPassed) {
        console.log("\n[SUCCESS] L'ensemble des services en production répondent correctement !\n");
        return true;
    } else {
        console.warn("\n[WARNING] Certains points de contrôle ont échoué ou présentent de la latence.\n");
        return false;
    }
}

if (require.main === module) {
    runProductionSanityCheck().then((success) => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = {
    runProductionSanityCheck,
    CHECKS
};
