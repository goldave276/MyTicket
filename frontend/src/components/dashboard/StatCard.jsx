import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex items-center justify-between">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</h4>
        {trend && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">{trend}</p>}
      </div>

      {Icon && (
        <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${colorMap[color] || colorMap.indigo}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
