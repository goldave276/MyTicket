import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import eventService from '@/services/eventService';
import reservationService from '@/services/reservationService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Badge from '@/components/common/Badge';
import ErrorState from '@/components/common/ErrorState';
import { getEventImage } from '@/utils/eventImages';
import { CalendarIcon, MapPinIcon, TicketIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/common/Icons';

export default function EventDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await eventService.getEventDetails(id);
      setEvent(data.event || data);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Événement introuvable', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    queueMicrotask(() => loadEvent());
  }, [loadEvent]);

  const handleBook = async () => {
    if (!user) {
      showToast('Veuillez vous connecter pour réserver des places', 'info');
      router.push(`/auth/login?redirect=/events/${id}`);
      return;
    }

    setBooking(true);
    try {
      await reservationService.createReservation({
        eventId: id,
        quantity: Number(quantity),
      });
      showToast(`Réservation de ${quantity} place(s) confirmée avec succès !`, 'success');
      router.push('/dashboard/tickets');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la réservation', 'error');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-12">
        <div className="h-80 bg-zinc-800 rounded-md w-full" />
        <div className="h-10 bg-zinc-800 rounded w-1/2" />
        <div className="h-20 bg-zinc-800 rounded w-full" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Événement introuvable"
          message="Cet événement n’existe plus, a été retiré, ou une erreur de connexion empêche de le charger."
          onRetry={loadEvent}
        />
        <div className="text-center mt-6">
          <Link href="/" className="eyebrow text-indigo-400 hover:underline">
            ← Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const eventPrice = event.price ?? event.ticket_price ?? 0;
  const available = event.available_tickets ?? event.availableTickets ?? 0;
  const totalPrice = eventPrice * quantity;
  const isSoldOut = available <= 0;
  const eventImage =
    event.image_url || event.imageUrl || getEventImage(event.event_type || event.eventType);

  return (
    <>
      <Head>
        <title>{event.title} - MyTicket</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back navigation */}
        <Link
          href="/"
          className="eyebrow inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          ← Retour au catalogue
        </Link>

        {/* Hero Cover Image & Header */}
        <div className="frame-corners relative rounded-md overflow-hidden h-80 sm:h-96 w-full border border-zinc-800 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Unsplash placeholder, not a next/image-optimized asset */}
          <img
            src={eventImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 space-y-3 text-white">
            <div className="flex flex-wrap gap-2">
              <span className="eyebrow px-3 py-1 rounded-sm bg-indigo-400 text-zinc-950">
                {event.event_type || event.eventType || 'Événement'}
              </span>
              <Badge status={event.status || 'APPROVED'} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{event.title}</h1>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Specs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-zinc-900/60 border border-zinc-800 rounded-md p-6">
              <div className="spec-item">
                <span className="spec-label">Catégorie</span>
                <span className="spec-value">{event.event_type || event.eventType || 'Événement'}</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Date</span>
                <span className="spec-value">
                  {event.date || event.event_date
                    ? new Date(event.date || event.event_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Non définie'}
                </span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Heure</span>
                <span className="spec-value">
                  {event.date || event.event_date
                    ? new Date(event.date || event.event_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Lieu</span>
                <span className="spec-value truncate">{event.location || 'Sur le billet'}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-md p-6 sm:p-8 space-y-4">
              <h3 className="eyebrow text-indigo-400">À propos de cet événement</h3>
              <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-4">
              <div className="eyebrow flex items-center gap-3 p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <CheckCircleIcon className="w-5 h-5 shrink-0" />
                Confirmation Instantanée & QR Pass
              </div>
              <div className="eyebrow flex items-center gap-3 p-4 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                <TicketIcon className="w-5 h-5 shrink-0" />
                Annulation & Gestion autonome
              </div>
            </div>
          </div>

          {/* Right Ticket Purchase Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-zinc-900/60 border border-zinc-800 rounded-md p-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <div className="spec-item">
                  <span className="spec-label">Prix par place</span>
                  <h4 className="text-2xl font-bold text-indigo-400">
                    {eventPrice === 0 ? 'GRATUIT' : `${eventPrice} FCFA`}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="eyebrow text-emerald-400">
                    {available} places rest.
                  </span>
                </div>
              </div>

              {!isSoldOut && (
                <div className="space-y-3">
                  <label className="spec-label block">
                    Nombre de places
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-md bg-zinc-800 font-bold text-lg hover:bg-zinc-700 transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(available, quantity + 1))}
                      className="w-10 h-10 rounded-md bg-zinc-800 font-bold text-lg hover:bg-zinc-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="spec-label">Montant total</span>
                <span className="text-xl font-bold text-white">
                  {totalPrice === 0 ? 'GRATUIT' : `${totalPrice} FCFA`}
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleBook}
                disabled={isSoldOut || booking}
                className={isSoldOut
                  ? 'w-full py-4 px-6 rounded-md font-mono uppercase tracking-wider text-xs font-semibold bg-zinc-800 text-zinc-500 cursor-not-allowed flex items-center justify-center gap-2'
                  : 'btn-primary w-full py-4'
                }
              >
                <TicketIcon className="w-5 h-5" />
                {booking ? 'Réservation...' : isSoldOut ? 'Événement Complet' : 'Confirmer ma Réservation'}
                {!isSoldOut && <ArrowRightIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
