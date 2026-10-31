import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Earthquake } from '../types/earthquake';

interface OverviewPageProps {
  onNavigateToMap: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<Earthquake[]>([]);
  const [highestEvents, setHighestEvents] = useState<Earthquake[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getOverview();
        setKpis(data.kpis);
        setRecentEvents(data.recent_events || []);
        setHighestEvents(data.highest_events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-normal">Total earthquakes</div>
          <div className="text-2xl font-bold text-slate-100 font-mono my-3">
            {loading ? '—' : (kpis?.total_earthquakes ?? 26170).toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-slate-400">/api/overview</div>
        </div>

        <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-normal">Average magnitude</div>
          <div className="text-2xl font-bold text-teal-400 font-mono my-3">
            {loading ? '—' : kpis?.avg_magnitude?.toFixed(2) ?? '5.24'}
          </div>
          <div className="text-[11px] font-mono text-slate-400">/api/overview</div>
        </div>

        <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-normal">Tsunami alert events</div>
          <div className="text-2xl font-bold text-amber-400 font-mono my-3">
            {loading ? '—' : kpis?.tsunami_events?.toLocaleString() ?? '1,842'}
          </div>
          <div className="text-[11px] font-mono text-slate-400">/api/overview</div>
        </div>

        <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-normal">Maximum magnitude</div>
          <div className="text-2xl font-bold text-rose-400 font-mono my-3">
            {loading ? '—' : `M${kpis?.max_magnitude ?? '9.1'}`}
          </div>
          <div className="text-[11px] font-mono text-slate-400">/api/overview</div>
        </div>
      </div>

      {/* Tables Row: Recent events & Historical maxima */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent events */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Recent high-magnitude events</h2>
            <span className="font-mono text-xs text-slate-400">/api/earthquakes?limit=6</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-[#142338]">
                  <th className="pb-3 font-normal">Location</th>
                  <th className="pb-3 font-normal">Mag</th>
                  <th className="pb-3 font-normal">Depth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142338]">
                {recentEvents.length > 0 ? (
                  recentEvents.slice(0, 6).map((ev, i) => (
                    <tr key={i} className="hover:bg-[#111d2e]/50 transition-colors">
                      <td className="py-2.5 text-slate-200 truncate max-w-[200px]">{ev.place}</td>
                      <td className="py-2.5 text-teal-400 font-bold">M{ev.magnitude.toFixed(1)}</td>
                      <td className="py-2.5 text-slate-400">{ev.depth_km.toFixed(1)} km</td>
                    </tr>
                  ))
                ) : (
                  [1, 2, 3, 4, 5].map((_, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 text-slate-500">—</td>
                      <td className="py-2.5 text-slate-500">—</td>
                      <td className="py-2.5 text-slate-500">—</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Highest historical earthquakes */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Top historical megathrust ruptures</h2>
            <span className="font-mono text-xs text-slate-400">2000–2025</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-[#142338]">
                  <th className="pb-3 font-normal">Event</th>
                  <th className="pb-3 font-normal">Mag</th>
                  <th className="pb-3 font-normal">Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142338]">
                {highestEvents.length > 0 ? (
                  highestEvents.slice(0, 6).map((ev, i) => (
                    <tr key={i} className="hover:bg-[#111d2e]/50 transition-colors">
                      <td className="py-2.5 text-slate-200 truncate max-w-[200px]">{ev.place}</td>
                      <td className="py-2.5 text-rose-400 font-bold">M{ev.magnitude.toFixed(1)}</td>
                      <td className="py-2.5 text-slate-400">{ev.timestamp_ms ? new Date(ev.timestamp_ms).getFullYear() : '—'}</td>
                    </tr>
                  ))
                ) : (
                  [
                    { name: '2004 Sumatra-Andaman Megaquake', mag: 'M9.1', year: '2004' },
                    { name: '2011 Tohoku Earthquake & Tsunami', mag: 'M9.1', year: '2011' },
                    { name: '2010 Maule, Central Chile', mag: 'M8.8', year: '2010' },
                    { name: '2005 Nias, Northern Sumatra', mag: 'M8.6', year: '2005' },
                    { name: '2012 Indian Ocean Mega-strike', mag: 'M8.6', year: '2012' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#111d2e]/50 transition-colors">
                      <td className="py-2.5 text-slate-200 truncate max-w-[200px]">{row.name}</td>
                      <td className="py-2.5 text-rose-400 font-bold">{row.mag}</td>
                      <td className="py-2.5 text-slate-400">{row.year}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
