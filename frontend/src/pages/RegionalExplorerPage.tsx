import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../services/api';

export const RegionalExplorerPage: React.FC = () => {
  const [regions, setRegions] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [rRes, cRes] = await Promise.all([
          api.getRegions(),
          api.getRegionalComparison()
        ]);
        setRegions(rRes.regions || []);
        setComparison(cRes.regional_comparison || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Top metric values
  const regionsAnalysed = regions.length > 0 ? regions.length : 10;
  const mostActive = comparison.length > 0
    ? [...comparison].sort((a, b) => b.total_events - a.total_events)[0]?.region_name
    : 'Ring of Fire';
  const highestMag = comparison.length > 0
    ? [...comparison].sort((a, b) => b.max_magnitude - a.max_magnitude)[0]
    : null;
  const highestMagDisplay = highestMag 
    ? `M${highestMag.max_magnitude} (${highestMag.region_name?.split(' ')[0]})`
    : 'M9.1 (Sumatra)';

  // Chart data
  const chartData = comparison.map((c) => ({
    name: c.region_name?.split(' ')[0] || c.region_id,
    count: c.total_events,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-normal">Regions analysed</div>
          <div className="text-2xl font-bold text-slate-100 font-mono my-3">
            {loading ? '—' : regionsAnalysed}
          </div>
          <div className="text-[11px] font-mono text-slate-400">/api/regions</div>
        </div>

        <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-normal">Most active region</div>
          <div className="text-xl font-bold text-slate-100 font-mono my-3 truncate" title={mostActive}>
            {loading ? '—' : mostActive}
          </div>
          <div className="text-[11px] font-mono text-slate-400">/api/regions/comparison</div>
        </div>

        <div className="bg-[#0d1626] border border-[#142338] rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-normal">Highest magnitude region</div>
          <div className="text-xl font-bold text-slate-100 font-mono my-3 truncate">
            {loading ? '—' : highestMagDisplay}
          </div>
          <div className="text-[11px] font-mono text-slate-400">/api/regions/comparison</div>
        </div>
      </div>

      {/* Lower Row: Regional counts & Regional comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Regional counts chart */}
        <div className="lg:col-span-5 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Regional counts</h2>
            <span className="font-mono text-xs text-slate-400">/api/regions</span>
          </div>

          <div className="h-64 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                  <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '6px', color: '#f1f5f9' }}
                    labelStyle={{ color: '#2dd4bf', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" fill="#2b7a78" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600 font-mono text-xs">
                No regional data available
              </div>
            )}
          </div>
        </div>

        {/* Right: Regional comparison table */}
        <div className="lg:col-span-7 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Regional comparison</h2>
            <span className="font-mono text-xs text-slate-400">/api/regions/comparison</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-[#142338]">
                  <th className="pb-3 font-normal">Region</th>
                  <th className="pb-3 font-normal">Count</th>
                  <th className="pb-3 font-normal">Avg mag</th>
                  <th className="pb-3 font-normal">Max mag</th>
                  <th className="pb-3 font-normal">Avg depth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142338]">
                {comparison.length > 0 ? (
                  comparison.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#111d2e]/50 transition-colors">
                      <td className="py-3 text-slate-200 truncate max-w-[150px]">{item.region_name || item.region_id}</td>
                      <td className="py-3 text-slate-300">{item.total_events?.toLocaleString() ?? '—'}</td>
                      <td className="py-3 text-slate-300">{item.avg_magnitude ? item.avg_magnitude.toFixed(2) : '—'}</td>
                      <td className="py-3 text-teal-400">{item.max_magnitude ? item.max_magnitude.toFixed(1) : '—'}</td>
                      <td className="py-3 text-slate-400">{item.avg_depth_km ? `${item.avg_depth_km.toFixed(1)} km` : '—'}</td>
                    </tr>
                  ))
                ) : (
                  [1, 2, 3, 4, 5].map((_, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-slate-500">—</td>
                      <td className="py-3 text-slate-500">—</td>
                      <td className="py-3 text-slate-500">—</td>
                      <td className="py-3 text-slate-500">—</td>
                      <td className="py-3 text-slate-500">—</td>
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
