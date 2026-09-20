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
    <div className="group relative rounded-md border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between">
      {/* Event Cover Image & Badge */}
      <div className="frame-corners relative h-48 w-full overflow-hidden bg-zinc-800">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="eyebrow px-2.5 py-1 rounded-sm bg-zinc-950/80 text-indigo-400 backdrop-blur-md">
            {category}
          </span>
          {showStatus && status && <Badge status={status} />}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4">
          <span className="eyebrow px-2.5 py-1.5 rounded-sm bg-indigo-400 text-zinc-950">
            {eventPrice === 0 ? 'GRATUIT' : `${eventPrice} FCFA`}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Spec Row */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800">
          <div className="spec-item">
            <span className="spec-label flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              Date
            </span>
            <span className="spec-value truncate">
              {eventDateStr
                ? new Date(eventDateStr).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'À venir'}
            </span>
          </div>

          <div className="spec-item">
            <span className="spec-label flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              Lieu
            </span>
            <span className="spec-value truncate">{location || 'Non spécifié'}</span>
          </div>
        </div>

        {/* Gauge & Remaining Tickets */}
        {!showStatus && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center">
              <span className="spec-label">Places restantes</span>
              <span className={`font-mono text-xs font-bold ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {remaining > 0 ? `${remaining} / ${total}` : 'ÉPUISÉ'}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentLeft < 15 ? 'bg-rose-500' : percentLeft < 40 ? 'bg-amber-500' : 'bg-indigo-400'
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
              className="btn-outline w-full"
            >
              Gérer l’événement
            </button>
          ) : (
            <Link
              href={`/events/${id}`}
              className={remaining === 0
                ? 'w-full inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wider text-xs font-semibold rounded-md py-3 px-4 bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'btn-primary w-full'
              }
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
