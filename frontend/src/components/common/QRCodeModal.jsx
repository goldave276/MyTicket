import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import { TicketIcon, CalendarIcon, MapPinIcon } from './Icons';

export default function QRCodeModal({ isOpen, onClose, ticket }) {
  if (!ticket) return null;

  // Generated entirely client-side with qrcode.react: the ticket holder's
  // data never leaves the browser to reach a third-party QR rendering service.
  const qrData = JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.eventId || ticket.event_id,
    user: ticket.userName || ticket.user_id,
    createdAt: ticket.createdAt || ticket.created_at,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pass Électronique / QR Code" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Ticket Header Info */}
        <div className="w-full bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-4">
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
            Pass Officiel MyTicket
          </span>
          <h4 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
            {ticket.eventName || ticket.event?.title || 'Événement MyTicket'}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            N° Ticket : <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{ticket.id}</span>
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-5 rounded-lg shadow-md border border-zinc-200 flex flex-col items-center justify-center">
          <QRCodeSVG value={qrData} size={192} level="M" includeMargin={false} />
          <p className="text-xs text-zinc-400 mt-3 font-mono">Scannez à l’entrée de la salle</p>
        </div>

        {/* Details list */}
        <div className="w-full text-left space-y-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span>
              {ticket.eventDate
                ? new Date(ticket.eventDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Date confirmée sur votre réservation'}
            </span>
          </div>
          {ticket.eventLocation && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-indigo-500" />
              <span>{ticket.eventLocation}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.print()}
          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <TicketIcon className="w-5 h-5" />
          Imprimer / Télécharger le Pass
        </button>
      </div>
    </Modal>
  );
}
