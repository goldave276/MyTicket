require("dotenv").config();

const { validateEventId, validateEventInput } = require("../validators/eventValidator");
const {
    validateReservationId,
    validateReservationInput
} = require("../validators/reservationValidator");
const { createReservation, getEventReservations } = require("../controllers/reservationController");
const { getOrganizerStats } = require("../controllers/eventController");
const { getAdminStats } = require("../controllers/adminController");
const fs = require("fs");
const path = require("path");

function createResponse() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

describe("Invariants SQL, RLS et Validations Safe BigInt (Phase B0.5)", () => {
    it("separe le refus de reservation expiree de la tache qui clot les evenements", () => {
        const migration = fs.readFileSync(
            path.join(__dirname, "../../supabase/migrations/0011_event_lifecycle_and_public_details.sql"),
            "utf8"
        );

        expect(migration).toContain("create or replace function public.finish_expired_events()");
        expect(migration).toContain("raise exception 'Cet evenement n est pas disponible'");
        expect(migration).not.toMatch(/set status = 'FINISHED'[\s\S]{0,300}raise exception 'Cet evenement est deja passe'/);
    });
    describe("Validation sans perte de precision sur les identifiants BigInt", () => {
        it("valide les identifiants entiers stricts dans la plage safe integer", () => {
            expect(validateEventId(1).isValid).toBe(true);
            expect(validateEventId(42).isValid).toBe(true);
            expect(validateEventId(Number.MAX_SAFE_INTEGER).isValid).toBe(true);

            expect(validateReservationId(100).isValid).toBe(true);
            expect(validateReservationId(Number.MAX_SAFE_INTEGER).isValid).toBe(true);
        });

        it("refuse les identifiants non entiers, negatifs, nuls ou hors safe integer", () => {
            expect(validateEventId(0).isValid).toBe(false);
            expect(validateEventId(-1).isValid).toBe(false);
            expect(validateEventId(1.5).isValid).toBe(false);
            expect(validateEventId("abc").isValid).toBe(false);
            expect(validateEventId("").isValid).toBe(false);
            expect(validateEventId(null).isValid).toBe(false);
            expect(validateEventId(9007199254740992).isValid).toBe(false); // > MAX_SAFE_INTEGER

            expect(validateReservationId(0).isValid).toBe(false);
            expect(validateReservationId(-5).isValid).toBe(false);
            expect(validateReservationId(3.14).isValid).toBe(false);
            expect(validateReservationId("invalid").isValid).toBe(false);
        });
    });

    describe("Validation stricte de createReservation", () => {
        it("valide une reservation conforme avec bornes de quantite (1 a 100)", () => {
            expect(validateReservationInput({ eventId: 1, quantity: 1 }).isValid).toBe(true);
            expect(validateReservationInput({ eventId: 1, quantity: 50 }).isValid).toBe(true);
            expect(validateReservationInput({ eventId: 1, quantity: 100 }).isValid).toBe(true);
        });

        it("refuse une reservation avec corps absent, tableau ou invalide", () => {
            expect(validateReservationInput(null).isValid).toBe(false);
            expect(validateReservationInput(undefined).isValid).toBe(false);
            expect(validateReservationInput([]).isValid).toBe(false);
            expect(validateReservationInput("string").isValid).toBe(false);
        });

        it("refuse les quantites negatives, nulles, decimales ou superieures a 100", () => {
            expect(validateReservationInput({ eventId: 1, quantity: 0 }).isValid).toBe(false);
            expect(validateReservationInput({ eventId: 1, quantity: -1 }).isValid).toBe(false);
            expect(validateReservationInput({ eventId: 1, quantity: 1.5 }).isValid).toBe(false);
            expect(validateReservationInput({ eventId: 1, quantity: 101 }).isValid).toBe(false);
        });

        it("refuse un eventId invalide ou malforme", () => {
            expect(validateReservationInput({ eventId: "notanumber", quantity: 2 }).isValid).toBe(false);
            expect(validateReservationInput({ eventId: 0, quantity: 2 }).isValid).toBe(false);
            expect(validateReservationInput({ eventId: -1, quantity: 2 }).isValid).toBe(false);
        });

        it("retourne 400 immediatement via createReservation sans appeler la RPC", async () => {
            const response = createResponse();
            const supabase = {
                rpc: () => {
                    throw new Error("La base ne doit pas etre appelee");
                }
            };

            await createReservation({ body: { eventId: 1, quantity: 200 }, supabase }, response);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("Evenement ou quantite invalide");
        });
    });

    describe("Suppression des fallbacks statistiques sous RLS", () => {
        it("getOrganizerStats renvoie 500 en cas d'erreur de la RPC sans calcul partiel", async () => {
            const response = createResponse();
            const supabase = {
                rpc: async (funcName) => {
                    expect(funcName).toBe("get_organizer_stats");
                    return { data: null, error: { message: "RPC error" } };
                },
                from: () => {
                    throw new Error("Aucune requete directe fallback ne doit etre executee");
                }
            };

            await getOrganizerStats({ supabase, user: { id: "user-id" } }, response);
            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe("Impossible de recuperer les statistiques de l'organisateur");
        });

        it("getAdminStats renvoie 500 en cas d'erreur de la RPC sans calcul partiel", async () => {
            const response = createResponse();
            const supabase = {
                rpc: async (funcName) => {
                    expect(funcName).toBe("get_admin_stats");
                    return { data: null, error: { message: "RPC error" } };
                },
                from: () => {
                    throw new Error("Aucune requete directe fallback ne doit etre executee");
                }
            };

            await getAdminStats({ supabase }, response);
            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe("Impossible de recuperer les statistiques administratives");
        });
    });

    describe("Invariants des evenements", () => {
        it("refuse la creation d'un evenement dont la capacite depasse 100 000 places", () => {
            const eventPayload = {
                title: "Festival Geant",
                description: "Description de plus de 10 caracteres.",
                eventType: "FESTIVAL",
                eventDate: "2028-06-01T20:00:00.000Z",
                location: "Stade",
                capacity: 100001,
                price: 1000
            };
            const result = validateEventInput(eventPayload);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("100 000");
        });
    });

    describe("Garanties SQL et Cycle de vie (Migration 0011)", () => {
        const migration0011 = fs.readFileSync(
            path.join(__dirname, "../../supabase/migrations/0011_event_lifecycle_and_public_details.sql"),
            "utf8"
        );

        it("definit le trigger BEFORE INSERT OR UPDATE pour les invariants d'evenement", () => {
            expect(migration0011).toContain("create trigger enforce_event_invariants_before_write");
            expect(migration0011).toContain("before insert or update on public.events");
            expect(migration0011).toContain("if new.status <> 'DRAFT' then");
            expect(migration0011).toContain("raise exception 'Un evenement doit etre cree au statut DRAFT'");
            expect(migration0011).toContain("raise exception 'La date de l evenement doit etre future'");
            expect(migration0011).toContain("new.capacity < 1 or new.capacity > 100000");
        });

        it("desactive atomiquement les reservations et billets lors de l'annulation d'un evenement", () => {
            expect(migration0011).toContain("create or replace function public.cancel_event(");
            expect(migration0011).toContain("update public.events");
            expect(migration0011).toContain("set status = 'CANCELLED'");
            expect(migration0011).toContain("update public.reservations");
            expect(migration0011).toContain("set status = 'CANCELLED'");
            expect(migration0011).toContain("status in ('PENDING', 'CONFIRMED')");
            expect(migration0011).toContain("update public.tickets");
            expect(migration0011).toContain("set status = 'CANCELLED'");
            expect(migration0011).toContain("status = 'ACTIVE'");
        });

        it("protege contre la retrogradation d'un organisateur possedant des evenements actifs ou futurs", () => {
            expect(migration0011).toContain("create or replace function public.admin_update_user_role(");
            expect(migration0011).toContain("if p_role = 'USER' then");
            expect(migration0011).toContain("where organizer_id = p_user_id");
            expect(migration0011).toContain("and status in ('APPROVED', 'PENDING')");
            expect(migration0011).toContain("and event_date > now()");
            expect(migration0011).toContain("Impossible de retrograder un organisateur ayant des evenements actifs ou futurs");
        });

        it("calcule la capacite restante de maniere atomique dans get_public_event_detail", () => {
            expect(migration0011).toContain("create or replace function public.get_public_event_detail(");
            expect(migration0011).toContain("'remainingCapacity', greatest(");
            expect(migration0011).toContain("e.capacity - coalesce(");
            expect(migration0011).toContain("where r.event_id = e.id");
            expect(migration0011).toContain("and r.status in ('PENDING', 'CONFIRMED')");
        });
    });
});


