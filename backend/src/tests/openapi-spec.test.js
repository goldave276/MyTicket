const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

const ROOT_DIR = path.join(__dirname, "../../..");
const OPENAPI_PATH = path.join(ROOT_DIR, "docs", "api.yaml");
const ROUTES_DIR = path.join(__dirname, "../routes");

const MOUNT_PREFIXES = {
    "authRoutes.js": "/api/auth",
    "organizerRequestRoutes.js": "/api/organizer-requests",
    "adminRoutes.js": "/api/admin",
    "eventRoutes.js": "/api/events",
    "reservationRoutes.js": "/api/reservations",
    "ticketRoutes.js": "/api/tickets",
    "paymentRoutes.js": "/api/payments"
};

function expressToOpenApiPath(prefix, routePath) {
    const joined = routePath === "/" ? prefix : `${prefix}${routePath}`;
    return joined.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

describe("Documentation OpenAPI (docs/api.yaml)", () => {
    it("est un fichier YAML OpenAPI 3.0.x valide avec les serveurs et schémas", () => {
        expect(fs.existsSync(OPENAPI_PATH)).toBe(true);
        const content = fs.readFileSync(OPENAPI_PATH, "utf8");
        const spec = yaml.parse(content);

        expect(spec.openapi).toMatch(/^3\.0\./);
        expect(spec.info?.title).toBe("MyTicket API");
        expect(spec.components?.securitySchemes?.BearerAuth?.type).toBe("http");
        expect(Object.keys(spec.paths || {}).length).toBeGreaterThanOrEqual(35);
    });

    it("documente chaque route Express et methode HTTP definie dans src/routes et App.js", () => {
        const spec = yaml.parse(fs.readFileSync(OPENAPI_PATH, "utf8"));
        const paths = spec.paths || {};

        // /api/health depuis App.js
        expect(paths["/api/health"]?.get).toBeDefined();

        const routeRegex = /router\.(get|post|patch|put|delete)\(\s*["']([^"']+)["']/g;

        for (const [filename, prefix] of Object.entries(MOUNT_PREFIXES)) {
            const source = fs.readFileSync(path.join(ROUTES_DIR, filename), "utf8");
            const matches = [...source.matchAll(routeRegex)];
            expect(matches.length).toBeGreaterThan(0);

            for (const match of matches) {
                const method = match[1].toLowerCase();
                const openApiPath = expressToOpenApiPath(prefix, match[2]);
                expect(
                    paths[openApiPath]?.[method],
                    `Route non documentee dans docs/api.yaml : ${method.toUpperCase()} ${openApiPath}`
                ).toBeDefined();
            }
        }
    });
});
