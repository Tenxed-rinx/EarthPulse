import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  color?: 'sky' | 'amber' | 'rose' | 'emerald' | 'purple';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'sky'
}) => {
  const colorStyles = {
    sky: 'border-sky-500/30 text-sky-400 bg-sky-500/10 shadow-sky-500/5',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-amber-500/5',
    rose: 'border-rose-500/30 text-rose-400 bg-rose-500/10 shadow-rose-500/5',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-emerald-500/5',
    purple: 'border-purple-500/30 text-purple-400 bg-purple-500/10 shadow-purple-500/5',
  };

  return (
    <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-white mt-1 tracking-tight font-mono">
            {value}
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
            <span>{subtext}</span>
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${colorStyles[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {/* Decorative subtle ambient light */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-slate-800/20 blur-2xl pointer-events-none"></div>
    </div>
  );
};
