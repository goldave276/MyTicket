import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import eventService from '@/services/eventService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { TicketIcon, CalendarIcon, UserIcon } from '@/components/common/Icons';

export default function EventReservationsListPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ready } = useRequireAuth({ role: 'ORGANIZER' });
  const { showToast } = useToast();

  const [reservations, setReservations] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchEventReservations = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [resData, eventData] = await Promise.all([
        eventService.getEventReservations(id),
        eventService.getEventDetails(id),
      ]);

      setReservations(Array.isArray(resData) ? resData : resData.reservations || []);
      setEventDetails(eventData?.event || eventData || { title: 'Événement' });
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les réservations', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchEventReservations());
  }, [ready, fetchEventReservations]);

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>Réservations de l’Événement - Organisateur</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="organizer" />

        <div className="flex-1 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <Link href="/organizer/events" className="text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
              ← Retour à la liste de mes événements
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mt-2">
              Réservations : {eventDetails?.title || 'Chargement...'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Liste complète des personnes ayant réservé leur billet pour cet événement.
            </p>
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <ErrorState title="Impossible de charger les réservations" onRetry={fetchEventReservations} />
          ) : reservations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <TicketIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Aucune réservation pour l’instant</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Dès que des participants réservent des tickets, leurs détails apparaissent ici.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase font-semibold text-zinc-500">
                    <tr>
                      <th className="p-4">Participant</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Quantité</th>
                      <th className="p-4">Date Réservation</th>
                      <th className="p-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                    {reservations.map((res) => {
                      const createdAt = res.createdAt || res.created_at;
                      return (
                        <tr key={res.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4 font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-indigo-500" />
                            {res.user?.fullName || res.user?.full_name || res.userName || 'Participant'}
                          </td>
                          <td className="p-4 text-xs font-mono text-zinc-500">{res.user?.email || res.userEmail || '-'}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-white text-xs">
                              {res.quantity} ticket(s)
                            </span>
                          </td>
                          <td className="p-4 text-xs text-zinc-500">
                            {createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </td>
                          <td className="p-4">
                            <Badge status={res.status || 'CONFIRMED'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
