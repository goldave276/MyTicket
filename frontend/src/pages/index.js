import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import eventService from '@/services/eventService';
import EventFilters from '@/components/events/EventFilters';
import EventGrid from '@/components/events/EventGrid';
import { TicketIcon, SparklesIcon, CalendarIcon, ShieldIcon } from '@/components/common/Icons';

const DEMO_EVENTS = [
  {
    id: 'demo-1',
    title: 'Festival Afrobeat & Culture 2026',
    description: 'Une soirée inoubliable célébrant les plus grands artistes Afrobeat du moment avec des prestations live exceptionnelles.',
    event_type: 'CONCERT',
    location: 'Palais des Congrès, Lomé',
    date: '2026-10-15T20:00:00Z',
    price: 5000,
    available_tickets: 45,
    total_tickets: 200,
    status: 'APPROVED',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'demo-2',
    title: 'Sommet Tech & Innovation Afrique',
    description: 'Conférence internationale regroupant fondateurs, investisseurs et développeurs autour des IA et des FinTechs.',
    event_type: 'CONFERENCE',
    location: 'Hôtel 2 Février, Lomé',
    date: '2026-11-05T09:00:00Z',
    price: 15000,
    available_tickets: 12,
    total_tickets: 150,
    status: 'APPROVED',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'demo-3',
    title: 'Pièce de Théâtre : L\'Héritage du Roi',
    description: 'Une tragédie comique vibrante interprétée par la troupe nationale dans une scénographie moderne.',
    event_type: 'THEATRE',
    location: 'Institut Français du Togo',
    date: '2026-09-28T19:30:00Z',
    price: 3000,
    available_tickets: 80,
    total_tickets: 100,
    status: 'APPROVED',
    image_url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    location: '',
    minPrice: '',
    maxPrice: '',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.getApprovedEvents(filters);
      const list = Array.isArray(data) ? data : data.events || data.data || [];
      // Use demo events if DB returns empty list initially
      if (list.length === 0 && !filters.search && !filters.eventType) {
        setEvents(DEMO_EVENTS);
      } else {
        setEvents(list);
      }
    } catch {
      // Fallback to demo events on API network error
      setEvents(DEMO_EVENTS);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
        <title>MyTicket - Réservation et Billetterie d'Événements</title>
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
              Événements à l'affiche
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
        <EventGrid events={events} loading={loading} />
      </section>
    </>
  );
}
