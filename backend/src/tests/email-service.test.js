import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendTicketConfirmationEmail,
  buildTicketEmailHtml,
  sendOrganizerRequestNotificationEmail,
  buildOrganizerRequestNotificationHtml,
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

  it("echappe les caracteres HTML dangereux et extrait la premiere URL de FRONTEND_URL", () => {
    const prevFrontend = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "http://localhost:3333,https://my-ticket-virid.vercel.app";
    try {
      const html = buildTicketEmailHtml({
        userName: '<script>alert("xss")</script>',
        eventTitle: 'Festival <img src=x onerror=alert(1)>',
        eventLocation: 'Lomé & "Plage"',
        tickets: [{ id: 1, ticket_code: '<b>fake</b>' }],
      });

      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
      expect(html).toContain("http://localhost:3333/dashboard/tickets");
      expect(html).not.toContain("http://localhost:3333,https://");
    } finally {
      if (prevFrontend === undefined) delete process.env.FRONTEND_URL;
      else process.env.FRONTEND_URL = prevFrontend;
    }
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

  it("genere un gabarit HTML d'alerte admin avec demandeur et lien admin", () => {
    const html = buildOrganizerRequestNotificationHtml({
      applicantName: "Edoh Kodjo",
      applicantEmail: "edoh@example.com",
      eventType: "FESTIVAL",
      description: "Organisation du festival annuel de musique afro.",
    });

    expect(html).toContain("Edoh Kodjo");
    expect(html).toContain("edoh@example.com");
    expect(html).toContain("FESTIVAL");
    expect(html).toContain("Organisation du festival annuel de musique afro.");
    expect(html).toContain("/admin/organizer-requests");
  });

  it("envoie ou simule l'email d'alerte pour l'administrateur sans lever d'erreur", async () => {
    const result = await sendOrganizerRequestNotificationEmail({
      adminEmail: "admin@myticket.tg",
      applicantName: "Edoh Kodjo",
      applicantEmail: "edoh@example.com",
      eventType: "CONCERT",
      description: "Production de concerts live à Lomé",
    });

    expect(result.success).toBe(true);
    expect(typeof result.messageId).toBe("string");
  });
});
