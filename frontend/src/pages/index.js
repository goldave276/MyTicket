import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import eventService from '@/services/eventService';
import { useToast } from '@/context/ToastContext';
import EventFilters, { getFilterValidationError } from '@/components/events/EventFilters';
import EventGrid from '@/components/events/EventGrid';
import Pagination from '@/components/common/Pagination';
import ErrorState from '@/components/common/ErrorState';
import { TicketIcon } from '@/components/common/Icons';

const CATALOG_PAGE_SIZE = 12;

const EMPTY_FILTERS = {
  search: '',
  eventType: '',
  location: '',
  minPrice: '',
  maxPrice: '',
  dateFrom: '',
  dateTo: '',
};

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: CATALOG_PAGE_SIZE, total: 0 });
  const catalogRef = useRef(null);

  useEffect(() => {
    if (!router.isReady) return;
    const queryType = typeof router.query.eventType === 'string' ? router.query.eventType.toUpperCase() : '';
    if (queryType) {
      queueMicrotask(() => {
        setFilters((prev) => (prev.eventType === queryType ? prev : { ...prev, eventType: queryType }));
        setPage(1);
      });
    }
  }, [router.isReady, router.query.eventType]);

  const fetchEvents = useCallback(async ({ silent = false } = {}) => {
    if (getFilterValidationError(filters)) {
      if (!silent) {
        setError(false);
        setLoading(false);
      }
      return;
    }
    if (!silent) setLoading(true);
    setError(false);
    try {
      const data = await eventService.getApprovedEvents({
        ...filters,
        page,
        limit: CATALOG_PAGE_SIZE,
      });
      const list = Array.isArray(data) ? data : data.events || data.data || [];
      setEvents(list);
      setPagination(
        data?.pagination || {
          page,
          limit: CATALOG_PAGE_SIZE,
          total: list.length,
        }
      );
    } catch (err) {
      if (!silent) {
        setError(true);
        showToast(err.message || 'Impossible de charger les événements', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters, page, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  useEffect(() => {
    const handleSilentRefresh = () => {
      if (document.visibilityState === 'visible') {
        fetchEvents({ silent: true });
      }
    };
    const handleDataUpdated = () => {
      fetchEvents({ silent: true });
    };

    window.addEventListener('focus', handleSilentRefresh);
    document.addEventListener('visibilitychange', handleSilentRefresh);
    window.addEventListener('myticket_data_updated', handleDataUpdated);

    return () => {
      window.removeEventListener('focus', handleSilentRefresh);
      document.removeEventListener('visibilitychange', handleSilentRefresh);
      window.removeEventListener('myticket_data_updated', handleDataUpdated);
    };
  }, [fetchEvents]);

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    if (catalogRef.current && typeof catalogRef.current.scrollIntoView === 'function') {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <Head>
        <title>MyTicket - Réservation et Billetterie d’Événements</title>
        <meta
          name="description"
          content="Découvrez concerts, conférences, festivals et ateliers près de chez vous. Réservez en ligne et recevez vos billets QR Pass sécurisés sur MyTicket."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MyTicket - Réservation et Billetterie d’Événements" />
        <meta
          property="og:description"
          content="Réservez vos places en ligne (Carte, Flooz, T-Money ou sur place) et accédez à vos QR Pass instantanément."
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Hero Banner Section */}
      <section className="grid-backdrop relative overflow-hidden rounded-md bg-zinc-900 text-white p-8 sm:p-12 lg:p-16 mb-12 border border-zinc-800">
        <span className="watermark-number absolute -top-6 -left-2 text-[10rem] sm:text-[14rem] select-none">01</span>

        <div className="relative max-w-3xl space-y-5">
          <span className="eyebrow text-indigo-400">
            Billetterie en ligne
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Réservez vos places pour les événements près de chez vous
          </h1>

          <p className="text-base text-zinc-300 leading-relaxed max-w-xl">
            Concerts, conférences, festivals et ateliers : trouvez un événement, réservez en quelques clics et recevez votre billet avec QR Pass.
          </p>

          {/* Quick facts */}
          <div className="pt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-zinc-800">
            <span className="eyebrow text-zinc-400">Billets sécurisés</span>
            <span className="eyebrow text-zinc-400">Réservation en ligne</span>
            <span className="eyebrow text-zinc-400">QR Pass à l’entrée</span>
          </div>
        </div>
      </section>

      {/* Main Catalog Header */}
      <section ref={catalogRef} className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="eyebrow text-indigo-400">Catalogue</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Événements à l’affiche
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Explorez les événements validés et ouverts à la réservation.
            </p>
          </div>

          <Link
            href="/dashboard/become-organizer"
            className="btn-outline"
          >
            <TicketIcon className="w-4 h-4" />
            Organiser un événement
          </Link>
        </div>

        {/* Filter Bar */}
        <EventFilters filters={filters} onChange={handleFiltersChange} onReset={handleResetFilters} />

        {/* Event Grid */}
        {error ? (
          <ErrorState title="Impossible de charger les événements" onRetry={fetchEvents} />
        ) : (
          <>
            <EventGrid events={events} loading={loading} />
            {!loading && (
              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </section>
    </>
  );
}
