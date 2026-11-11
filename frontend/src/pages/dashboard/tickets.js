import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import ticketService from '@/services/ticketService';
import Sidebar from '@/components/dashboard/Sidebar';
import QRCodeModal from '@/components/common/QRCodeModal';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { TicketIcon, QrCodeIcon, CalendarIcon, MapPinIcon } from '@/components/common/Icons';

export default function UserTicketsPage() {
  const { ready } = useRequireAuth();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await ticketService.getMyTickets();
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch (err) {
      if (
        err.status === 401 ||
        err.message?.includes('Authentification') ||
        err.message?.includes('Session expirée') ||
        (typeof window !== 'undefined' && !localStorage.getItem('myticket_token'))
      ) {
        return;
      }
      setError(true);
      showToast(err.message || 'Impossible de charger vos billets', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchTickets());
  }, [ready, fetchTickets]);

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>Mes Billets Électroniques - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="user" />

        <div className="flex-1 space-y-6">
          <div className="border-b border-white/10 pb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mes Billets & Pass Électroniques
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Accédez à vos QR Codes d’accès pour les événements auxquels vous participez.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <ErrorState title="Impossible de charger vos billets" onRetry={fetchTickets} />
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#11141e] p-8 sm:p-12 text-center space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                <QrCodeIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-white">Aucun billet généré</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Dès que vous confirmez une réservation, vos pass QR apparaissent ici automatiquement.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-white/10 bg-[#11141e] p-5 shadow-lg space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                        PASS CONFIRMÉ
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        #{String(ticket.ticket_code || ticket.id).slice(0, 8)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white line-clamp-1">
                      {ticket.eventName || ticket.event?.title || 'Événement MyTicket'}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-300 font-medium">
                          {ticket.eventDate || ticket.event?.event_date || ticket.event?.date
                            ? new Date(ticket.eventDate || ticket.event?.event_date || ticket.event?.date).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Date validée'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{ticket.eventLocation || ticket.event?.location || 'Lieu spécifié'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                    >
                      <QrCodeIcon className="w-4 h-4" />
                      <span>Voir QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setTimeout(() => window.print(), 300);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                    >
                      <TicketIcon className="w-4 h-4 text-cyan-400" />
                      <span>Imprimer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal QR Code */}
        <QRCodeModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
        />
      </div>
    </>
  );
}
