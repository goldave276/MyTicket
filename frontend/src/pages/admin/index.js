import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import adminService from '@/services/adminService';
import Sidebar from '@/components/dashboard/Sidebar';
import StatCard from '@/components/dashboard/StatCard';
import ErrorState from '@/components/common/ErrorState';
import { ShieldIcon, BuildingIcon, TicketIcon, UserIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function AdminDashboardPage() {
  const { ready } = useRequireAuth({ role: 'ADMIN' });
  const { showToast } = useToast();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizers: 0,
    pendingRequests: 0,
    pendingEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getGlobalStats();
      setStats({
        totalUsers: data.totalUsers ?? 0,
        totalOrganizers: data.totalOrganizers ?? 0,
        pendingRequests: data.pendingRequests ?? 0,
        pendingEvents: data.pendingEvents ?? 0,
      });
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les statistiques', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchAdminStats());
  }, [ready, fetchAdminStats]);

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>Administration Générale - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="admin" />

        <div className="flex-1 space-y-8">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Administration de la Plateforme
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Supervisez les accréditations, la modération des événements et la gestion des utilisateurs.
            </p>
          </div>

          {error ? (
            <ErrorState title="Impossible de charger les statistiques" onRetry={fetchAdminStats} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Utilisateurs Inscrits"
                value={loading ? '—' : stats.totalUsers}
                icon={UserIcon}
                color="indigo"
              />
              <StatCard
                title="Organisateurs Validés"
                value={loading ? '—' : stats.totalOrganizers}
                icon={BuildingIcon}
                color="purple"
              />
              <StatCard
                title="Demandes Organisateur"
                value={loading ? '—' : stats.pendingRequests}
                icon={ShieldIcon}
                color="amber"
              />
              <StatCard
                title="Événements à valider"
                value={loading ? '—' : stats.pendingEvents}
                icon={TicketIcon}
                color="emerald"
              />
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BuildingIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Demandes Organisateur</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Examinez les dossiers d’accréditation soumis par les membres et validez leurs rôles.
                </p>
              </div>
              <Link
                href="/admin/organizer-requests"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm transition-colors"
              >
                Gérer les demandes
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-md space-y-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TicketIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Modération des Événements</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Approuvez ou refusez la publication des événements soumis par les organisateurs.
                </p>
              </div>
              <Link
                href="/admin/events-pending"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm transition-colors"
              >
                Valider les événements
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
