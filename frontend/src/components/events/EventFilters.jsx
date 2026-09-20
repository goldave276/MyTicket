import React from 'react';
import { SearchIcon, FilterIcon } from '../common/Icons';

const CATEGORIES = [
  { id: '', label: 'Toutes les catégories' },
  { id: 'CONCERT', label: 'Concerts & Musique' },
  { id: 'CONFERENCE', label: 'Conférences & Tech' },
  { id: 'THEATRE', label: 'Théâtre & Spectacles' },
  { id: 'FESTIVAL', label: 'Festivals' },
  { id: 'SPORT', label: 'Sport & Compétitions' },
  { id: 'WORKSHOP', label: 'Ateliers & Formations' },
];

export default function EventFilters({ filters, onChange, onReset }) {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.eventType || filters.location || filters.minPrice || filters.maxPrice
  );

  return (
    <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md p-6 mb-8 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher un événement, un artiste, un lieu..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-md bg-zinc-950/60 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-medium text-sm transition-all"
          />
        </div>

        {/* Category Selector */}
        <div className="relative w-full md:w-64">
          <select
            value={filters.eventType || ''}
            onChange={(e) => handleChange('eventType', e.target.value)}
            className="w-full px-4 py-3.5 rounded-md bg-zinc-950/60 border border-zinc-700/80 text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 appearance-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-zinc-900">
                {cat.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Advanced Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/80 items-center">
        {/* Location input */}
        <input
          type="text"
          placeholder="Lieu (ex: Lomé, Palais)"
          value={filters.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          className="w-full px-4 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />

        {/* Min Price */}
        <input
          type="number"
          placeholder="Prix min (FCFA)"
          value={filters.minPrice || ''}
          onChange={(e) => handleChange('minPrice', e.target.value)}
          className="w-full px-4 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />

        {/* Max Price */}
        <input
          type="number"
          placeholder="Prix max (FCFA)"
          value={filters.maxPrice || ''}
          onChange={(e) => handleChange('maxPrice', e.target.value)}
          className="w-full px-4 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="eyebrow w-full py-2.5 px-4 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center justify-center gap-1.5"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  );
}
