import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import eventService from '@/services/eventService';
import Sidebar from '@/components/dashboard/Sidebar';
import StatCard from '@/components/dashboard/StatCard';
import EventGrid from '@/components/events/EventGrid';
import ErrorState from '@/components/common/ErrorState';
import { TicketIcon, BuildingIcon, BarChartIcon, PlusIcon } from '@/components/common/Icons';

export default function OrganizerDashboardPage() {
  const { ready } = useRequireAuth({ role: 'ORGANIZER' });
  const { showToast } = useToast();

  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsData, eventsData] = await Promise.all([
        eventService.getOrganizerStats(),
        eventService.getMyEvents(),
      ]);

      const myEventsList = Array.isArray(eventsData) ? eventsData : eventsData.events || [];
      setEvents(myEventsList);

      setStats({
        totalEvents: statsData.totalEvents ?? myEventsList.length,
        activeEvents: statsData.activeEvents ?? myEventsList.filter((e) => e.status === 'APPROVED').length,
        totalTicketsSold: statsData.totalTicketsSold ?? 0,
        totalRevenue: statsData.totalRevenue ?? 0,
      });
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger votre tableau de bord', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchDashboardData());
  }, [ready, fetchDashboardData]);

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>Tableau de bord Organisateur - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="organizer" />

        <div className="flex-1 space-y-8">
          <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="eyebrow text-indigo-400">Organisateur</span>
              <h1 className="page-title mt-1">
                Espace Organisateur
              </h1>
              <p className="page-subtitle">
                Pilotez vos événements, suivez la billetterie et analysez vos réservations.
              </p>
            </div>

            <Link
              href="/organizer/events/create"
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5" />
              Créer un Événement
            </Link>
          </div>

          {error ? (
            <ErrorState title="Impossible de charger votre tableau de bord" onRetry={fetchDashboardData} />
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Événements"
                  value={stats.totalEvents}
                  icon={BuildingIcon}
                  color="indigo"
                />
                <StatCard
                  title="Événements Actifs"
                  value={stats.activeEvents}
                  icon={TicketIcon}
                  color="emerald"
                />
                <StatCard
                  title="Tickets Vendus"
                  value={stats.totalTicketsSold}
                  icon={BarChartIcon}
                  color="purple"
                />
                <StatCard
                  title="Revenu Estimé"
                  value={`${stats.totalRevenue.toLocaleString()} FCFA`}
                  icon={BarChartIcon}
                  color="amber"
                />
              </div>

              {/* Recent Events Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Vos Événements Récents</h3>
                  <Link href="/organizer/events" className="eyebrow text-indigo-400 hover:underline">
                    Voir tous mes événements →
                  </Link>
                </div>

                <EventGrid events={events.slice(0, 6)} loading={loading} showStatus={true} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
