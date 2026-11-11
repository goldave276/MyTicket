const nodemailer = require("nodemailer");

/**
 * Transactional Email Service for MyTicket.
 * Supports Brevo, Resend, Sendgrid, Mailgun, or standard SMTP servers.
 * Falls back to simulation mode when SMTP credentials are not configured.
 */

let cachedTransporter = null;

function escapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    // Return null to trigger sandbox / simulation mode
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return cachedTransporter;
}

/**
 * Builds a clean, responsive HTML email for ticket confirmation.
 */
function buildTicketEmailHtml({ userName, eventTitle, eventDate, eventLocation, tickets, totalAmount, currency }) {
  const safeUserName = escapeHtml(userName || "Cher participant");
  const safeEventTitle = escapeHtml(eventTitle || "Événement MyTicket");
  const safeEventLocation = eventLocation ? escapeHtml(eventLocation) : "";
  const safeCurrency = escapeHtml(currency || "XOF");
  const primaryFrontendUrl = (process.env.FRONTEND_URL || "http://localhost:3333")
    .split(",")[0]
    .trim();

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date à confirmer";

  const ticketRows = Array.isArray(tickets) && tickets.length > 0
    ? tickets
        .map(
          (t, index) => `
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #3f3f46; padding-bottom: 8px; margin-bottom: 8px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #22d3ee; font-weight: 700;">PASS ENTRÉE #${index + 1}</span>
            <span style="font-family: monospace; font-size: 12px; color: #a1a1aa;">${escapeHtml(t.ticket_code || t.id || "VALIDE")}</span>
          </div>
          <div style="color: #ffffff; font-weight: 600; font-size: 14px; margin-bottom: 4px;">${safeEventTitle}</div>
          <div style="color: #94a3b8; font-size: 12px;">📅 ${formattedDate}</div>
          ${safeEventLocation ? `<div style="color: #94a3b8; font-size: 12px;">📍 ${safeEventLocation}</div>` : ""}
        </div>
      `
        )
        .join("")
    : `
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 12px; color: #ffffff;">
        <p style="margin: 0;">Vos billets sont confirmés et disponibles sur votre compte.</p>
      </div>
    `;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vos billets pour ${safeEventTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f2f4f2;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0d0c; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #121512; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 2px solid #22d3ee;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">My<span style="color: #22d3ee;">Ticket</span></h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Confirmation de Réservation</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">Bonjour ${safeUserName},</h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Votre paiement a été confirmé avec succès ! Vous trouverez ci-dessous votre récapitulatif de commande et vos pass d'accès.
              </p>

              <!-- Event Card -->
              <div style="background-color: #1e293b; border-left: 4px solid #22d3ee; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #22d3ee; font-weight: 700;">Événement</div>
                <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 4px 0;">${safeEventTitle}</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 6px;">📅 ${formattedDate}</div>
                ${safeEventLocation ? `<div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">📍 ${safeEventLocation}</div>` : ""}
                ${totalAmount ? `<div style="font-size: 13px; color: #22d3ee; margin-top: 6px; font-weight: 600;">Total payé : ${escapeHtml(totalAmount)} ${safeCurrency}</div>` : ""}
              </div>

              <!-- Tickets List -->
              <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                Vos Billets (${Array.isArray(tickets) ? tickets.length : 1})
              </div>
              ${ticketRows}

              <!-- Instructions & CTA -->
              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="${escapeHtml(primaryFrontendUrl)}/dashboard/tickets" style="background-color: #0891b2; color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 2px 10px rgba(8, 145, 178, 0.4);">
                  Accéder à mes QR Codes d'accès
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                💡 <em>Conseil : Vous pouvez afficher vos QR codes sur smartphone ou les imprimer à l'avance pour un contrôle rapide à l'entrée.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0d0a; padding: 20px 24px; text-align: center; border-top: 1px solid #27272a; font-size: 11px; color: #64748b;">
              <p style="margin: 0 0 6px;">Cet email vous a été envoyé automatiquement suite à votre réservation sur MyTicket.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} MyTicket. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends a ticket confirmation email.
 * Non-blocking: will never reject or crash the calling process.
 */
async function sendTicketConfirmationEmail({
  to,
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  tickets = [],
  totalAmount,
  currency = "XOF",
}) {
  if (!to) {
    console.warn("[emailService] Destinataire manquant, email non envoyé.");
    return { success: false, reason: "MISSING_RECIPIENT" };
  }

  const transporter = getTransporter();
  const html = buildTicketEmailHtml({
    userName,
    eventTitle,
    eventDate,
    eventLocation,
    tickets,
    totalAmount,
    currency,
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"MyTicket Billetterie" <no-reply@myticket.tg>',
    to,
    subject: `🎟️ Vos billets pour "${eventTitle || "votre événement"}" - MyTicket`,
    html,
  };

  if (!transporter) {
    console.info(
      `[emailService:SIMULATION] Email simulé envoyé avec succès à ${to} pour "${eventTitle}". (Configurer SMTP_HOST/SMTP_USER/SMTP_PASS pour l'envoi réel)`
    );
    return { success: true, simulated: true, messageId: `simulated-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info(`[emailService] Email de confirmation envoyé à ${to} (MessageId: ${info.messageId})`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (err) {
    console.error(`[emailService] Erreur lors de l'envoi d'email à ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

function buildOrganizerRequestNotificationHtml({
  applicantName,
  applicantEmail,
  eventType,
  description,
}) {
  const safeName = escapeHtml(applicantName || "Membre MyTicket");
  const safeEmail = escapeHtml(applicantEmail || "Non communiqué");
  const safeEventType = escapeHtml(eventType || "Non précisé");
  const safeDesc = escapeHtml(description || "Aucune description fournie");
  const adminUrl = `${(process.env.FRONTEND_URL || "http://localhost:3333").split(",")[0].trim()}/admin/organizer-requests`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle demande d'accréditation Organisateur</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f2f4f2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d0c; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111312; border: 1px solid #1f2421; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #c7d2fe; font-weight: 700;">Administration MyTicket</span>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 6px 0 0 0;">Nouvelle demande Organisateur</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; line-height: 1.5; color: #d4d4d8; margin: 0 0 20px 0;">
                Un utilisateur vient de soumettre un dossier pour obtenir le statut d’<strong>Organisateur officiel</strong> sur MyTicket.
              </p>
              <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Demandeur :</span>
                  <div style="color: #ffffff; font-weight: 600; font-size: 15px;">${safeName} (<a href="mailto:${safeEmail}" style="color: #818cf8; text-decoration: none;">${safeEmail}</a>)</div>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Type d'événements envisagés :</span>
                  <div style="color: #ffffff; font-weight: 500; font-size: 14px;">${safeEventType}</div>
                </div>
                <div>
                  <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Description / Note :</span>
                  <div style="color: #e4e4e7; font-size: 13px; line-height: 1.4; white-space: pre-wrap; margin-top: 4px;">${safeDesc}</div>
                </div>
              </div>
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${adminUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                  Examiner la demande dans l'Admin
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #0d0f0e; border-top: 1px solid #1f2421; text-align: center; font-size: 12px; color: #71717a;">
              Notification administrative automatique générée par MyTicket.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envoie une notification à l'administrateur lorsqu'un utilisateur soumet une demande organisateur.
 */
async function sendOrganizerRequestNotificationEmail({
  adminEmail,
  applicantName,
  applicantEmail,
  eventType,
  description,
}) {
  const recipient = adminEmail || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!recipient) {
    console.warn("[emailService] Aucun email administrateur configuré pour la notification.");
    return { success: false, reason: "MISSING_ADMIN_EMAIL" };
  }

  const transporter = getTransporter();
  const html = buildOrganizerRequestNotificationHtml({
    applicantName,
    applicantEmail,
    eventType,
    description,
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"MyTicket Billetterie" <no-reply@myticket.tg>',
    to: recipient,
    subject: `🔔 Nouvelle demande Organisateur : ${applicantName || applicantEmail || "Un membre"} - MyTicket`,
    html,
  };

  if (!transporter) {
    console.info(
      `[emailService:SIMULATION] Alerte demande organisateur simulée envoyée à l'admin ${recipient} pour ${applicantEmail}.`
    );
    return { success: true, simulated: true, messageId: `simulated-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info(`[emailService] Alerte demande organisateur envoyée à l'admin ${recipient} (MessageId: ${info.messageId})`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (err) {
    console.error(`[emailService] Erreur envoi email admin:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendTicketConfirmationEmail,
  buildTicketEmailHtml,
  sendOrganizerRequestNotificationEmail,
  buildOrganizerRequestNotificationHtml,
  escapeHtml,
  getTransporter,
};
