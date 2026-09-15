import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import eventService from '@/services/eventService';
import { useToast } from '@/context/ToastContext';
import EventFilters from '@/components/events/EventFilters';
import EventGrid from '@/components/events/EventGrid';
import ErrorState from '@/components/common/ErrorState';
import { TicketIcon } from '@/components/common/Icons';

export default function Home() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    location: '',
    minPrice: '',
    maxPrice: '',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await eventService.getApprovedEvents(filters);
      const list = Array.isArray(data) ? data : data.events || data.data || [];
      setEvents(list);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les événements', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      eventType: '',
      location: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  return (
    <>
      <Head>
        <title>MyTicket - Réservation et Billetterie d’Événements</title>
      </Head>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-xl bg-zinc-900 text-white p-8 sm:p-12 lg:p-16 mb-12 border border-zinc-800">
        <div className="max-w-3xl space-y-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Billetterie en ligne
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Réservez vos places pour les événements près de chez vous
          </h1>

          <p className="text-base text-zinc-300 leading-relaxed max-w-xl">
            Concerts, conférences, festivals et ateliers : trouvez un événement, réservez en quelques clics et recevez votre billet avec QR Pass.
          </p>

          {/* Quick facts */}
          <div className="pt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-zinc-800 text-sm text-zinc-400">
            <span>Billets sécurisés</span>
            <span>Réservation en ligne</span>
            <span>QR Pass à l’entrée</span>
          </div>
        </div>
      </section>

      {/* Main Catalog Header */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Événements à l’affiche
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Explorez les événements validés et ouverts à la réservation.
            </p>
          </div>

          <Link
            href="/dashboard/become-organizer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold transition-colors"
          >
            <TicketIcon className="w-4 h-4" />
            Organiser un événement
          </Link>
        </div>

        {/* Filter Bar */}
        <EventFilters filters={filters} onChange={setFilters} onReset={handleResetFilters} />

        {/* Event Grid */}
        {error ? (
          <ErrorState title="Impossible de charger les événements" onRetry={fetchEvents} />
        ) : (
          <EventGrid events={events} loading={loading} />
        )}
      </section>
    </>
  );
}
