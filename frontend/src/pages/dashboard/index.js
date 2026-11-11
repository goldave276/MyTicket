import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import reservationService from '@/services/reservationService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { TicketIcon, CalendarIcon, QrCodeIcon, XCircleIcon } from '@/components/common/Icons';

export default function UserReservationsPage() {
  const { ready } = useRequireAuth();
  const { showToast } = useToast();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await reservationService.getMyReservations();
      setReservations(Array.isArray(data) ? data : data.reservations || []);
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
      showToast(err.message || 'Impossible de charger vos réservations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!ready) return;
    // Deferred to a microtask: `fetchReservations` sets state synchronously
    // (the loading flag) before its first `await`, and React's compiler
    // flags a *synchronous* setState call inside an effect body. Queuing it
    // this way keeps the fetch effect-driven without tripping that rule.
    queueMicrotask(() => fetchReservations());
  }, [ready, fetchReservations]);

  const handleCancel = async (reservationId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      await reservationService.cancelReservation(reservationId);
      showToast('Réservation annulée avec succès', 'info');
      fetchReservations();
    } catch (err) {
      showToast(err.message || 'Impossible d’annuler la réservation', 'error');
    }
  };

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>Mes Réservations - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="user" />

        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Mes Réservations
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Gérez l’ensemble de vos places réservées pour les événements à venir.
              </p>
            </div>

            <Link
              href="/dashboard/tickets"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-cyan-500 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 active:scale-95 transition-all min-h-[44px]"
            >
              <QrCodeIcon className="w-4 h-4" />
              <span>Voir mes QR Pass</span>
            </Link>
          </div>

          {loading ? (
            <SkeletonTable rows={4} />
          ) : error ? (
            <ErrorState title="Impossible de charger vos réservations" onRetry={fetchReservations} />
          ) : reservations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#11141e] p-8 sm:p-12 text-center space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                <TicketIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-white">Aucune réservation pour le moment</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Découvrez les événements à l’affiche et réservez vos premiers tickets !
                </p>
              </div>
              <Link
                href="/"
                className="btn-primary"
              >
                Explorer le catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Version Mobile : Cartes individuelles optimisées tactile */}
              <div className="md:hidden space-y-3">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-[#11141e] border border-white/10 space-y-3 shadow-md"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-white text-base">
                        {res.event?.title || res.eventName || 'Événement'}
                      </h4>
                      <Badge status={res.status || 'CONFIRMED'} />
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {res.event?.event_date || res.event?.date || res.eventDate
                            ? new Date(res.event?.event_date || res.event?.date || res.eventDate).toLocaleDateString('fr-FR')
                            : 'À venir'}
                        </span>
                      </div>
                      <div className="truncate">
                        {res.event?.location || res.eventLocation || 'Lieu non spécifié'}
                      </div>
                      <div className="pt-1 font-semibold text-slate-200">
                        {res.quantity} place(s) réservée(s)
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      <Link
                        href="/dashboard/tickets"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-bold active:scale-95 transition-all min-h-[44px]"
                      >
                        <QrCodeIcon className="w-4 h-4" />
                        <span>Mon Pass QR</span>
                      </Link>
                      {res.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(res.id)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold active:scale-95 transition-all min-h-[44px]"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          <span>Annuler</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Version Desktop : Tableau classique */}
              <div className="hidden md:block bg-[#11141e] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-white/5 border-b border-white/10 text-xs uppercase font-semibold text-slate-400">
                      <tr>
                        <th className="p-4">Événement</th>
                        <th className="p-4">Date & Lieu</th>
                        <th className="p-4">Quantité</th>
                        <th className="p-4">Statut</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {reservations.map((res) => (
                        <tr key={res.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-white">
                            {res.event?.title || res.eventName || 'Événement'}
                          </td>
                          <td className="p-4 space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                              {res.event?.event_date || res.event?.date || res.eventDate
                                ? new Date(res.event?.event_date || res.event?.date || res.eventDate).toLocaleDateString('fr-FR')
                                : 'À venir'}
                            </div>
                            <div className="text-slate-400 truncate max-w-[180px]">
                              {res.event?.location || res.eventLocation || 'Lieu non spécifié'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-white/10 font-semibold text-white text-xs">
                              {res.quantity} place(s)
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge status={res.status || 'CONFIRMED'} />
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Link
                              href="/dashboard/tickets"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 font-bold text-xs hover:bg-cyan-500/25 transition-colors"
                            >
                              <QrCodeIcon className="w-3.5 h-3.5" />
                              Pass QR
                            </Link>
                            {res.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleCancel(res.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition-colors"
                              >
                                <XCircleIcon className="w-3.5 h-3.5" />
                                Annuler
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
