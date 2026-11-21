import React from 'react';

/**
 * Generates a compact page sequence with ellipses when totalPages > 7.
 */
function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) pages.push('...');
  for (let p = left; p <= right; p += 1) {
    pages.push(p);
  }
  if (right < totalPages - 1) pages.push('...');
  pages.push(totalPages);

  return pages;
}

export default function Pagination({
  page = 1,
  limit = 12,
  total = 0,
  onPageChange,
}) {
  const safeLimit = Math.max(1, Number(limit) || 12);
  const safeTotal = Math.max(0, Number(total) || 0);
  const totalPages = Math.ceil(safeTotal / safeLimit);

  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const pages = buildPageNumbers(currentPage, totalPages);

  const handleSelect = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    onPageChange?.(nextPage);
  };

  return (
    <nav
      aria-label="Pagination du catalogue"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800/80"
    >
      <p className="text-xs font-mono text-zinc-400">
        Page <strong className="text-white">{currentPage}</strong> sur{' '}
        <strong className="text-white">{totalPages}</strong> — {safeTotal} événement
        {safeTotal > 1 ? 's' : ''}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => handleSelect(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Page précédente"
          className="min-h-[44px] px-3.5 py-2 rounded-md border border-zinc-800 bg-zinc-900/70 text-xs font-semibold text-zinc-200 hover:border-indigo-500/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          ← Précédent
        </button>

        {pages.map((entry, idx) =>
          entry === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-xs font-mono text-zinc-500 select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => handleSelect(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === currentPage ? 'page' : undefined}
              className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-md text-xs font-mono font-bold transition-colors touch-manipulation ${
                entry === currentPage
                  ? 'bg-indigo-500 text-zinc-950 border border-indigo-400 shadow-sm'
                  : 'border border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-indigo-500/50 hover:text-white'
              }`}
            >
              {entry}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => handleSelect(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Page suivante"
          className="min-h-[44px] px-3.5 py-2 rounded-md border border-zinc-800 bg-zinc-900/70 text-xs font-semibold text-zinc-200 hover:border-indigo-500/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          Suivant →
        </button>
      </div>
    </nav>
  );
}
