import React from 'react';
import { XCircleIcon } from './Icons';

/**
 * Shown when a data fetch genuinely fails (network error, 401, 500...).
 * Never replace this with fabricated placeholder data — a failed request
 * must look like a failed request, not like real content.
 */
export default function ErrorState({
  title = 'Impossible de charger les données',
  message = 'Une erreur est survenue lors de la communication avec le serveur. Vérifiez votre connexion et réessayez.',
  onRetry,
}) {
  return (
    <div className="w-full rounded-md border border-dashed border-rose-900/50 p-12 text-center flex flex-col items-center justify-center space-y-4 my-8 bg-rose-950/10">
      <div className="w-16 h-16 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
        <XCircleIcon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="eyebrow inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white transition-all"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
