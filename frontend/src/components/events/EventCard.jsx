import React from 'react';
import Link from 'next/link';
import Badge from '../common/Badge';
import { CalendarIcon, MapPinIcon, TicketIcon, ArrowRightIcon } from '../common/Icons';
import { getEventImage } from '@/utils/eventImages';

export default function EventCard({ event, showStatus = false, onAction }) {
  if (!event) return null;

  const {
    id,
    title,
    description,
    event_type,
    eventType,
    location,
    date,
    event_date,
    price,
    ticket_price,
    available_tickets,
    availableTickets,
    total_tickets,
    totalTickets,
    status,
    image_url,
    imageUrl,
  } = event;

  const category = event_type || eventType || 'Événement';
  const eventDateStr = date || event_date;
  const eventPrice = price ?? ticket_price ?? 0;
  const remaining = available_tickets ?? availableTickets ?? 0;
  const total = total_tickets ?? totalTickets ?? 100;
  const image = image_url || imageUrl || getEventImage(category);

  const percentLeft = Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));

  return (
    <div className="group relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between">
      {/* Event Cover Image & Badge */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white backdrop-blur-md shadow-md uppercase tracking-wider">
            {category}
          </span>
          {showStatus && status && <Badge status={status} />}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4">
          <span className="px-3.5 py-1.5 rounded-full text-sm font-black bg-indigo-600 text-white shadow-lg">
            {eventPrice === 0 ? 'GRATUIT' : `${eventPrice} FCFA`}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">
              {eventDateStr
                ? new Date(eventDateStr).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Date à venir'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">{location || 'Lieu non spécifié'}</span>
          </div>
        </div>

        {/* Gauge & Remaining Tickets */}
        {!showStatus && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">Places restantes</span>
              <span className={remaining > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                {remaining > 0 ? `${remaining} / ${total}` : 'ÉPUISÉ'}
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  percentLeft < 15 ? 'bg-rose-500' : percentLeft < 40 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${percentLeft}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {onAction ? (
            <button
              onClick={() => onAction(event)}
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
            >
              Gérer l’événement
            </button>
          ) : (
            <Link
              href={`/events/${id}`}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                remaining === 0
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20 hover:scale-[1.02]'
              }`}
            >
              <TicketIcon className="w-4 h-4" />
              {remaining === 0 ? 'Complet' : 'Réserver une place'}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
