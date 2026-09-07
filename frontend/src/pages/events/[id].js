import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import eventService from '@/services/eventService';
import reservationService from '@/services/reservationService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Badge from '@/components/common/Badge';
import { CalendarIcon, MapPinIcon, TicketIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/common/Icons';

export default function EventDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadEvent() {
      setLoading(true);
      try {
        const data = await eventService.getEventDetails(id);
        setEvent(data.event || data);
      } catch {
        // Fallback for demo events
        setEvent({
          id: id,
          title: 'Festival Afrobeat & Culture 2026',
          description: 'Une soirée inoubliable célébrant les plus grands artistes Afrobeat du moment avec des prestations live exceptionnelles et une expérience sonore haut de gamme.',
          event_type: 'CONCERT',
          location: 'Palais des Congrès, Lomé',
          date: '2026-10-15T20:00:00Z',
          price: 5000,
          available_tickets: 45,
          total_tickets: 200,
          status: 'APPROVED',
          image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        });
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

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
        <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-3xl w-full" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      </div>
    );
  }

  if (!event) return null;

  const eventPrice = event.price ?? event.ticket_price ?? 0;
  const available = event.available_tickets ?? event.availableTickets ?? 0;
  const totalPrice = eventPrice * quantity;
  const isSoldOut = available <= 0;

  return (
    <>
      <Head>
        <title>{event.title} - MyTicket</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          ← Retour au catalogue
        </Link>

        {/* Hero Cover Image & Header */}
        <div className="relative rounded-3xl overflow-hidden h-80 sm:h-96 w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-zinc-900">
          <img
            src={event.image_url || event.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 space-y-3 text-white">
            <div className="flex flex-wrap gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-indigo-600 uppercase tracking-wider">
                {event.event_type || event.eventType || 'Événement'}
              </span>
              <Badge status={event.status || 'APPROVED'} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{event.title}</h1>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Specs Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase">Date & Heure</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {event.date || event.event_date
                      ? new Date(event.date || event.event_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Date non définie'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase">Lieu</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{event.location || 'Adresse indiquée sur le billet'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">À propos de cet événement</h3>
              <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <CheckCircleIcon className="w-5 h-5 shrink-0" />
                Confirmation Instantanée & QR Pass
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                <TicketIcon className="w-5 h-5 shrink-0" />
                Annulation & Gestion autonome
              </div>
            </div>
          </div>

          {/* Right Ticket Purchase Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-bold uppercase text-zinc-400">Prix par place</span>
                  <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {eventPrice === 0 ? 'GRATUIT' : `${eventPrice} FCFA`}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {available} places rest.
                  </span>
                </div>
              </div>

              {!isSoldOut && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
                    Nombre de places
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-black text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(available, quantity + 1))}
                      className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-sm font-bold">
                <span className="text-zinc-600 dark:text-zinc-400">Montant total</span>
                <span className="text-xl font-black text-zinc-900 dark:text-white">
                  {totalPrice === 0 ? 'GRATUIT' : `${totalPrice} FCFA`}
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleBook}
                disabled={isSoldOut || booking}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isSoldOut
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 hover:scale-[1.02]'
                }`}
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
