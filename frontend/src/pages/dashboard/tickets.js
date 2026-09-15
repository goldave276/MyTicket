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
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Mes Billets & Pass Électroniques
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Accédez à vos QR Codes d’accès pour les événements auxquels vous participez.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <ErrorState title="Impossible de charger vos billets" onRetry={fetchTickets} />
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <QrCodeIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Aucun billet généré</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Dès que vous confirmez une réservation, vos pass QR apparaissent ici automatiquement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-md space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        PASS VERIFIÉ
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-400">#{String(ticket.id).slice(-8)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">
                      {ticket.eventName || ticket.event?.title || 'Événement MyTicket'}
                    </h3>

                    <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>
                          {ticket.eventDate || ticket.event?.date
                            ? new Date(ticket.eventDate || ticket.event?.date).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Date validée'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate">{ticket.eventLocation || ticket.event?.location || 'Lieu spécifié'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    Afficher le QR Code
                  </button>
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
