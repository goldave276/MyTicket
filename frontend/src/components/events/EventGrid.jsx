import React from 'react';
import EventCard from './EventCard';
import { SkeletonCard } from '../common/Skeleton';
import { SparklesIcon } from '../common/Icons';

export default function EventGrid({ events = [], loading = false, showStatus = false, onAction }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="w-full rounded-md border border-dashed border-zinc-800 p-12 text-center flex flex-col items-center justify-center space-y-4 my-8 bg-zinc-900/30">
        <div className="w-16 h-16 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <SparklesIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Aucun événement trouvé</h3>
        <p className="text-sm text-zinc-400 max-w-md">
          Aucun événement ne correspond à vos critères actuels. Essayez de modifier votre recherche ou vos filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} showStatus={showStatus} onAction={onAction} />
      ))}
    </div>
  );
}
