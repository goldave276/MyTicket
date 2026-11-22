import React, { useState } from 'react';
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

export function getFilterValidationError(filters = {}) {
  const minP = filters.minPrice !== '' && filters.minPrice !== undefined ? Number(filters.minPrice) : null;
  const maxP = filters.maxPrice !== '' && filters.maxPrice !== undefined ? Number(filters.maxPrice) : null;
  if (minP !== null && minP < 0) return 'Le prix minimum doit être positif ou nul.';
  if (maxP !== null && maxP < 0) return 'Le prix maximum doit être positif ou nul.';
  if (minP !== null && maxP !== null && minP > maxP) {
    return 'Le prix minimum ne peut pas dépasser le prix maximum.';
  }
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    return 'La date de début doit précéder ou égaler la date de fin.';
  }
  return '';
}

export default function EventFilters({ filters, onChange, onReset }) {
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);

  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.eventType || filters.location || filters.minPrice || filters.maxPrice || filters.dateFrom || filters.dateTo
  );
  const advancedCount = [
    filters.location,
    filters.dateFrom,
    filters.dateTo,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  const validationError = getFilterValidationError(filters);

  return (
    <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md p-4 sm:p-6 mb-8 space-y-4 sm:space-y-5">
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
          <input
            id="filter-search"
            name="search"
            type="text"
            aria-label="Rechercher un événement"
            placeholder="Rechercher un événement, un artiste, un lieu..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-md bg-zinc-950/60 border border-zinc-700/80 text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-medium text-base sm:text-sm transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleChange('search', '')}
              aria-label="Effacer la recherche"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Selector */}
        <div className="relative w-full md:w-64">
          <select
            id="filter-event-type"
            name="eventType"
            aria-label="Catégorie d'événement"
            value={filters.eventType || ''}
            onChange={(e) => handleChange('eventType', e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-zinc-950/60 border border-zinc-700/80 text-white font-medium text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 appearance-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-zinc-900">
                {cat.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Mobile Toggle for Advanced Filters */}
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedMobile((prev) => !prev)}
          aria-expanded={showAdvancedMobile}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-zinc-950/70 border border-zinc-700/80 text-xs font-semibold text-zinc-200 hover:border-indigo-400/60 transition-colors touch-manipulation"
        >
          <FilterIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Filtres avancés{advancedCount > 0 ? ` (${advancedCount})` : ''}</span>
          <span className="text-zinc-400">{showAdvancedMobile ? '▲' : '▼'}</span>
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-md bg-rose-500/10"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Advanced Filter Row */}
      <div
        className={`${
          showAdvancedMobile ? 'grid' : 'hidden'
        } md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-4 border-t border-zinc-800/80 items-end`}
      >
        {/* Location input */}
        <div className="space-y-1">
          <label htmlFor="filter-location" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300">
            Lieu
          </label>
          <input
            id="filter-location"
            name="location"
            type="text"
            placeholder="ex: Lomé"
            value={filters.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white placeholder-zinc-400 text-base sm:text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Date From */}
        <div className="space-y-1">
          <label htmlFor="filter-date-from" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300">
            Du
          </label>
          <input
            id="filter-date-from"
            name="dateFrom"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white text-base sm:text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400 [color-scheme:dark]"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <label htmlFor="filter-date-to" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300">
            Au
          </label>
          <input
            id="filter-date-to"
            name="dateTo"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white text-base sm:text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400 [color-scheme:dark]"
          />
        </div>

        {/* Min Price */}
        <div className="space-y-1">
          <label htmlFor="filter-min-price" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300">
            Prix min (FCFA)
          </label>
          <input
            id="filter-min-price"
            name="minPrice"
            type="number"
            min="0"
            placeholder="0"
            value={filters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white placeholder-zinc-400 text-base sm:text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Max Price */}
        <div className="space-y-1">
          <label htmlFor="filter-max-price" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300">
            Prix max (FCFA)
          </label>
          <input
            id="filter-max-price"
            name="maxPrice"
            type="number"
            min="0"
            placeholder="Illimité"
            value={filters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950/40 border border-zinc-700/60 text-white placeholder-zinc-400 text-base sm:text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Reset Filters (desktop) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="hidden md:flex eyebrow w-full py-2.5 px-4 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors items-center justify-center gap-1.5"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {validationError && (
        <p role="alert" className="text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md px-3.5 py-2">
          ⚠️ {validationError}
        </p>
      )}
    </div>
  );
}
