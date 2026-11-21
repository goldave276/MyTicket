import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { exportDatabaseBackup } from "../../scripts/backup-db";

describe("Database Backup Utility (Disaster Recovery)", () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "myticket-backup-test-"));
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("lève une erreur si aucun client ni credentials ne sont fournis", async () => {
        await expect(exportDatabaseBackup({ client: null, supabaseUrl: "", supabaseKey: "" }))
            .rejects
            .toThrow("SUPABASE_URL et clé Supabase nécessaires");
    });

    it("génère un fichier de sauvegarde JSON valide avec checksum SHA-256 et récapitulatif", async () => {
        const mockTablesData = {
            profiles: [{ id: "usr_1", role: "USER", full_name: "Jean Dupont" }],
            organizer_requests: [],
            events: [{ id: 1, title: "Concert de Lomé", capacity: 500 }],
            reservations: [{ id: 10, user_id: "usr_1", status: "CONFIRMED" }],
            tickets: [{ id: 100, ticket_code: "uuid-ticket-1", status: "VALID" }],
            payments: [{ id: 50, amount: 5000, status: "COMPLETED" }]
        };

        const mockClient = {
            from: vi.fn((table) => ({
                select: vi.fn().mockResolvedValue({
                    data: mockTablesData[table] || [],
                    error: null
                })
            }))
        };

        const result = await exportDatabaseBackup({
            client: mockClient,
            outputDir: tempDir
        });

        expect(fs.existsSync(result.filePath)).toBe(true);
        expect(result.summary.profiles.count).toBe(1);
        expect(result.summary.events.count).toBe(1);
        expect(result.summary.organizer_requests.count).toBe(0);
        expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);

        const raw = fs.readFileSync(result.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        expect(parsed.version).toBe("1.0.0");
        expect(parsed.tables.profiles[0].full_name).toBe("Jean Dupont");
        expect(parsed.checksum).toBe(result.checksum);
    });

    it("gère gracieusement les erreurs de lecture d'une table sans interrompre l'ensemble", async () => {
        const mockClient = {
            from: vi.fn((table) => ({
                select: vi.fn().mockImplementation(() => {
                    if (table === "organizer_requests") {
                        return Promise.resolve({ data: null, error: new Error("RLS error") });
                    }
                    return Promise.resolve({ data: [{ id: 1 }], error: null });
                })
            }))
        };

        const result = await exportDatabaseBackup({
            client: mockClient,
            outputDir: tempDir,
            tables: ["profiles", "organizer_requests"]
        });

        expect(result.summary.profiles.status).toBe("OK");
        expect(result.summary.organizer_requests.status).toBe("ERROR");
        expect(result.summary.organizer_requests.count).toBe(0);
    });
});
