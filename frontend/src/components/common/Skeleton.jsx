import React from 'react';

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-zinc-200 dark:bg-zinc-800 w-full" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/5" />
        </div>
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-9 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 animate-pulse">
      <div className="h-12 bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 border-b border-zinc-100 dark:border-zinc-800/60 p-4 flex items-center gap-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/6" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/6" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/6" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}
