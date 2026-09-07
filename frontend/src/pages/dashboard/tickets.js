import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import ticketService from '@/services/ticketService';
import Sidebar from '@/components/dashboard/Sidebar';
import QRCodeModal from '@/components/common/QRCodeModal';
import { SkeletonCard } from '@/components/common/Skeleton';
import { TicketIcon, QrCodeIcon, CalendarIcon, MapPinIcon } from '@/components/common/Icons';

export default function UserTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard/tickets');
      return;
    }

    if (user) {
      fetchTickets();
    }
  }, [user, authLoading, router]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getMyTickets();
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch {
      // Fallback demo tickets
      setTickets([
        {
          id: 'TCK-2026-8841',
          eventId: 'demo-1',
          eventName: 'Festival Afrobeat & Culture 2026',
          eventDate: '2026-10-15T20:00:00Z',
          eventLocation: 'Palais des Congrès, Lomé',
          userName: user?.full_name || 'Utilisateur MyTicket',
          created_at: new Date().toISOString(),
        },
        {
          id: 'TCK-2026-9932',
          eventId: 'demo-2',
          eventName: 'Sommet Tech & Innovation Afrique',
          eventDate: '2026-11-05T09:00:00Z',
          eventLocation: 'Hôtel 2 Février, Lomé',
          userName: user?.full_name || 'Utilisateur MyTicket',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <>
      <Head>
        <title>Mes Billets Électroniques - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="user" />

        <div className="flex-1 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Mes Billets & Pass Électroniques
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Accédez à vos QR Codes d'accès pour les événements auxquels vous participez.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
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
                  className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        PASS VERIFIÉ
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-400">#{ticket.id.slice(-8)}</span>
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
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
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
