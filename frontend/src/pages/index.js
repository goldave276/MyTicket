import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import eventService from '@/services/eventService';
import { useToast } from '@/context/ToastContext';
import EventFilters from '@/components/events/EventFilters';
import EventGrid from '@/components/events/EventGrid';
import ErrorState from '@/components/common/ErrorState';
import { TicketIcon, SparklesIcon } from '@/components/common/Icons';

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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-indigo-950 to-purple-950 text-white p-8 sm:p-12 lg:p-16 mb-12 shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-indigo-300 border border-white/10 backdrop-blur-md">
            <SparklesIcon className="w-4 h-4 text-indigo-400" />
            Plateforme N°1 de Billetterie Événementielle
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Vivez des moments <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Inoubliables.
            </span>
          </h1>

          <p className="text-lg text-zinc-300 leading-relaxed font-normal">
            Réservez vos places pour les plus grands concerts, conférences et événements culturels en quelques clics avec QR Pass instantané.
          </p>

          {/* Quick Metrics */}
          <div className="pt-4 grid grid-cols-3 gap-6 border-t border-white/10 max-w-lg">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">100%</span>
              <p className="text-xs text-zinc-400 font-medium">Billets Sécurisés</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-indigo-400">24/7</span>
              <p className="text-xs text-zinc-400 font-medium">Réservation Directe</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-purple-400">QR Code</span>
              <p className="text-xs text-zinc-400 font-medium">Pass Électronique</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Header */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
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
