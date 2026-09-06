const { validateEventQuery, escapePostgrestValue } = require("../validators/eventQueryValidator");

describe("Validateur de requete d'evenements (eventQueryValidator)", () => {
    it("valide et normalise une requete vide avec les valeurs par defaut", () => {
        const result = validateEventQuery({});
        expect(result.isValid).toBe(true);
        expect(result.value).toEqual({
            page: 1,
            limit: 20
        });
    });

    it("accepte des filtres valides", () => {
        const result = validateEventQuery({
            search: "Concert",
            eventType: "Musique",
            location: "Lome",
            minPrice: "1000",
            maxPrice: "5000",
            dateFrom: "2027-01-01T00:00:00.000Z",
            dateTo: "2027-12-31T23:59:59.000Z",
            page: "2",
            limit: "10"
        });

        expect(result.isValid).toBe(true);
        expect(result.value).toEqual({
            search: "Concert",
            eventType: "Musique",
            location: "Lome",
            minPrice: 1000,
            maxPrice: 5000,
            dateFrom: "2027-01-01T00:00:00.000Z",
            dateTo: "2027-12-31T23:59:59.000Z",
            page: 2,
            limit: 10
        });
    });

    it("rejette des prix non numeriques ou negatifs", () => {
        const result = validateEventQuery({ minPrice: "notanumber", maxPrice: "-50" });
        expect(result.isValid).toBe(false);
        expect(result.errors.minPrice).toBeDefined();
        expect(result.errors.maxPrice).toBeDefined();
    });

    it("rejette si minPrice > maxPrice", () => {
        const result = validateEventQuery({ minPrice: "500", maxPrice: "100" });
        expect(result.isValid).toBe(false);
        expect(result.errors.minPrice).toContain("superieur");
    });

    it("rejette une date invalide", () => {
        const result = validateEventQuery({ dateFrom: "invalid-date" });
        expect(result.isValid).toBe(false);
        expect(result.errors.dateFrom).toBeDefined();
    });

    it("rejette si dateFrom > dateTo", () => {
        const result = validateEventQuery({
            dateFrom: "2027-06-01T00:00:00.000Z",
            dateTo: "2027-01-01T00:00:00.000Z"
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.dateFrom).toContain("posterieure");
    });

    it("rejette les limites de pagination invalides", () => {
        const result = validateEventQuery({ page: "0", limit: "100" });
        expect(result.isValid).toBe(false);
        expect(result.errors.page).toBeDefined();
        expect(result.errors.limit).toBeDefined();
    });

    it("echappe les caracteres speciaux PostgREST", () => {
        const raw = "concert, (test):. %\\";
        const escaped = escapePostgrestValue(raw);
        expect(escaped).toBe("concert test ");
    });
});
