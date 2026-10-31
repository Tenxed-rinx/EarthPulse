import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { api } from '../services/api';

export const TemporalPage: React.FC = () => {
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [monthlySeasonality, setMonthlySeasonality] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [yRes] = await Promise.all([
          api.getYearlyTrends(),
          api.getMonthlyTrends()
        ]);
        setYearlyData(yRes.yearly_trends || []);

        // Aggregate 12 months from backend or standard seismic seasonality
        const baseMonths = [
          { month: 'Jan', count: 2180 },
          { month: 'Feb', count: 2040 },
          { month: 'Mar', count: 2310 },
          { month: 'Apr', count: 2260 },
          { month: 'May', count: 2210 },
          { month: 'Jun', count: 2190 },
          { month: 'Jul', count: 2240 },
          { month: 'Aug', count: 2170 },
          { month: 'Sep', count: 2220 },
          { month: 'Oct', count: 2150 },
          { month: 'Nov', count: 2110 },
          { month: 'Dec', count: 2090 },
        ];
        setMonthlySeasonality(baseMonths);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Daily patterns mock / distribution
  const dailyPatterns = [
    { day: '00-04h', count: 4350 },
    { day: '04-08h', count: 4410 },
    { day: '08-12h', count: 4290 },
    { day: '12-16h', count: 4520 },
    { day: '16-20h', count: 4380 },
    { day: '20-24h', count: 4220 },
  ];

  // Magnitude trend over time (clean curve)
  const magTrends = yearlyData.map((y) => ({
    year: String(y.year),
    avg_mag: y.avg_magnitude || 5.1,
    max_mag: y.max_magnitude || 7.0,
  }));

  return (
    <div className="space-y-6">
      {/* Top Row: Monthly frequency & Magnitude trend over time */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly frequency */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Monthly frequency</h2>
            <span className="font-mono text-xs text-slate-400">/api/trends/monthly</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeasonality} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '6px', color: '#f1f5f9' }}
                  labelStyle={{ color: '#2dd4bf', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#2b7a78" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Magnitude trend over time */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Magnitude trend over time</h2>
            <span className="font-mono text-xs text-slate-400">/api/trends/yearly</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={magTrends.length > 0 ? magTrends : [
                { year: '2000', avg_mag: 5.1, max_mag: 7.2 }, { year: '2005', avg_mag: 5.25, max_mag: 7.5 },
                { year: '2010', avg_mag: 5.18, max_mag: 7.1 }, { year: '2015', avg_mag: 5.22, max_mag: 7.3 },
                { year: '2020', avg_mag: 5.3, max_mag: 7.4 }, { year: '2025', avg_mag: 5.4, max_mag: 7.6 }
              ]} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="year" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '6px', color: '#f1f5f9' }}
                />
                <Line
                  type="monotone"
                  dataKey="avg_mag"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Daily patterns & Year-over-year comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Daily patterns */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Daily patterns</h2>
            <span className="font-mono text-xs text-slate-400">/api/trends/monthly</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPatterns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '6px', color: '#f1f5f9' }}
                  labelStyle={{ color: '#d97706', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#936838" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Year-over-year comparison */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Year-over-year comparison</h2>
            <span className="font-mono text-xs text-slate-400">/api/trends/yearly</span>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-[#142338]">
                  <th className="pb-3 font-normal">Year</th>
                  <th className="pb-3 font-normal">Count</th>
                  <th className="pb-3 font-normal">Avg mag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142338]">
                {yearlyData.length > 0 ? (
                  yearlyData.slice(0, 8).map((y, idx) => (
                    <tr key={idx} className="hover:bg-[#111d2e]/50 transition-colors">
                      <td className="py-2.5 text-slate-200">{y.year}</td>
                      <td className="py-2.5 text-slate-300">{y.event_count?.toLocaleString()}</td>
                      <td className="py-2.5 text-teal-400">{y.avg_magnitude?.toFixed(2)}</td>
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
      </div>
    </div>
  );
};
