import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="panel p-6 flex items-center justify-between">
      <div>
        <span className="eyebrow text-zinc-400">
          {title}
        </span>
        <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
        {trend && <p className="text-xs font-medium text-emerald-400 mt-1">{trend}</p>}
      </div>

      {Icon && (
        <div className={`w-12 h-12 rounded-md border flex items-center justify-center ${colorMap[color] || colorMap.indigo}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
