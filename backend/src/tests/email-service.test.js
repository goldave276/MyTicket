import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendTicketConfirmationEmail,
  buildTicketEmailHtml,
} from "../services/emailService.js";

describe("Email Service - Transactional Emails", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("genere un gabarit HTML complet avec les details de l'evenement et des billets", () => {
    const html = buildTicketEmailHtml({
      userName: "Koffi Mensah",
      eventTitle: "Concert Live Lomé 2026",
      eventDate: "2026-12-31T20:00:00Z",
      eventLocation: "Palais des Congrès de Lomé",
      tickets: [
        { id: 101, ticket_code: "11111111-2222-3333-4444-555555555555" },
        { id: 102, ticket_code: "66666666-7777-8888-9999-000000000000" },
      ],
      totalAmount: 10000,
      currency: "XOF",
    });

    expect(html).toContain("Koffi Mensah");
    expect(html).toContain("Concert Live Lomé 2026");
    expect(html).toContain("Palais des Congrès de Lomé");
    expect(html).toContain("11111111-2222-3333-4444-555555555555");
    expect(html).toContain("10000 XOF");
    expect(html).toContain("Accéder à mes QR Codes d'accès");
  });

  it("refuse d'envoyer si le destinataire est manquant", async () => {
    const result = await sendTicketConfirmationEmail({
      to: "",
      userName: "Anonyme",
      eventTitle: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("MISSING_RECIPIENT");
  });

  it("bascule automatiquement en mode simulation sans credentials SMTP", async () => {
    const originalHost = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;

    const result = await sendTicketConfirmationEmail({
      to: "client@example.com",
      userName: "Ablavi Dogbe",
      eventTitle: "Festival des Grillades",
      tickets: [{ id: 1, ticket_code: "ticket-uuid-1" }],
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.messageId).toMatch(/^simulated-/);

    if (originalHost) {
      process.env.SMTP_HOST = originalHost;
    }
  });
});
