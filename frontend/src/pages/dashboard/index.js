import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import reservationService from '@/services/reservationService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { TicketIcon, CalendarIcon, QrCodeIcon, XCircleIcon } from '@/components/common/Icons';

export default function UserReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard');
      return;
    }

    if (user) {
      fetchReservations();
    }
  }, [user, authLoading, router]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await reservationService.getMyReservations();
      setReservations(Array.isArray(data) ? data : data.reservations || []);
    } catch {
      // Fallback demo data
      setReservations([
        {
          id: 'res-101',
          eventId: 'demo-1',
          event: {
            title: 'Festival Afrobeat & Culture 2026',
            date: '2026-10-15T20:00:00Z',
            location: 'Palais des Congrès, Lomé',
          },
          quantity: 2,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      await reservationService.cancelReservation(reservationId);
      showToast('Réservation annulée avec succès', 'info');
      fetchReservations();
    } catch (err) {
      showToast(err.message || 'Impossible d\'annuler la réservation', 'error');
    }
  };

  if (authLoading || !user) return null;

  return (
    <>
      <Head>
        <title>Mes Réservations - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="user" />

        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                Mes Réservations
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Gérez l'ensemble de vos places réservées pour les événements à venir.
              </p>
            </div>

            <Link
              href="/dashboard/tickets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
            >
              <QrCodeIcon className="w-4 h-4" />
              Voir mes QR Pass
            </Link>
          </div>

          {loading ? (
            <SkeletonTable rows={4} />
          ) : reservations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <TicketIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Aucune réservation pour le moment</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Découvrez les événements à l'affiche et réservez vos premiers tickets !
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
              >
                Explorer le catalogue
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase font-extrabold text-zinc-500">
                    <tr>
                      <th className="p-4">Événement</th>
                      <th className="p-4">Date & Lieu</th>
                      <th className="p-4">Quantité</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 dark:text-white">
                          {res.event?.title || res.eventName || 'Événement'}
                        </td>
                        <td className="p-4 space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                            {res.event?.date || res.eventDate
                              ? new Date(res.event?.date || res.eventDate).toLocaleDateString('fr-FR')
                              : 'À venir'}
                          </div>
                          <div className="text-zinc-400 truncate max-w-[180px]">
                            {res.event?.location || res.eventLocation || 'Lieu non spécifié'}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-extrabold text-zinc-900 dark:text-white text-xs">
                            {res.quantity} place(s)
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge status={res.status || 'CONFIRMED'} />
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Link
                            href="/dashboard/tickets"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-colors"
                          >
                            <QrCodeIcon className="w-3.5 h-3.5" />
                            Pass QR
                          </Link>
                          {res.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancel(res.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors"
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
          )}
        </div>
      </div>
    </>
  );
}
