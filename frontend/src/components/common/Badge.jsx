import React from 'react';

const STATUS_CONFIGS = {
  // Event Statuses
  DRAFT: { label: 'Brouillon', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' },
  PENDING: { label: 'En attente', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  APPROVED: { label: 'Approuvé', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  REJECTED: { label: 'Refusé', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  FINISHED: { label: 'Terminé', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },

  // Reservation Statuses
  CONFIRMED: { label: 'Confirmée', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },

  // Roles
  USER: { label: 'Membre', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' },
  ORGANIZER: { label: 'Organisateur', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  ADMIN: { label: 'Administrateur', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
};

export default function Badge({ status, customLabel, className = '' }) {
  const config = STATUS_CONFIGS[status] || {
    label: customLabel || status,
    color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${config.color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75 animate-pulse" />
      {customLabel || config.label}
    </span>
  );
}
