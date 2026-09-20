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
          <div className="page-header">
            <span className="eyebrow text-indigo-400">Administration</span>
            <h1 className="page-title mt-1">
              Administration de la Plateforme
            </h1>
            <p className="page-subtitle">
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
            <div className="panel p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <BuildingIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Demandes Organisateur</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Examinez les dossiers d’accréditation soumis par les membres et validez leurs rôles.
                </p>
              </div>
              <Link
                href="/admin/organizer-requests"
                className="pill bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              >
                Gérer les demandes
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="panel p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TicketIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Modération des Événements</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Approuvez ou refusez la publication des événements soumis par les organisateurs.
                </p>
              </div>
              <Link
                href="/admin/events-pending"
                className="pill pill-emerald"
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
