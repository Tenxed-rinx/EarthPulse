import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { api } from '../services/api';

export const MagnitudeDepthPage: React.FC = () => {
  const [magDist, setMagDist] = useState<any[]>([]);
  const [depthIntervals, setDepthIntervals] = useState<any[]>([]);
  const [scatterSample, setScatterSample] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, dRes] = await Promise.all([
          api.getMagnitudeDistribution(),
          api.getDepthAnalysis()
        ]);
        setMagDist(mRes.magnitude_distribution || []);
        setDepthIntervals(dRes.depth_intervals || []);
        setScatterSample(dRes.scatter_sample || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Magnitude categories table
  const magCategories = magDist.map((m) => ({
    band: m.range || m.category,
    count: m.count,
  }));

  // Scatter plot points (magnitude vs depth)
  const scatterPoints = (scatterSample.length > 0 ? scatterSample : [
    { magnitude: 4.8, depth_km: 10 },
    { magnitude: 5.2, depth_km: 25 },
    { magnitude: 5.5, depth_km: 40 },
    { magnitude: 6.0, depth_km: 30 },
    { magnitude: 6.4, depth_km: 65 },
    { magnitude: 6.8, depth_km: 50 },
    { magnitude: 7.2, depth_km: 120 },
    { magnitude: 7.6, depth_km: 15 },
    { magnitude: 8.1, depth_km: 28 },
    { magnitude: 9.1, depth_km: 30 },
  ]).map((pt) => ({
    mag: pt.magnitude,
    depth: pt.depth_km,
  }));

  return (
    <div className="space-y-6">
      {/* Top Row: Magnitude distribution & Depth distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Magnitude distribution */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Magnitude distribution</h2>
            <span className="font-mono text-xs text-slate-400">/api/magnitude/distribution</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={magDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '6px', color: '#f1f5f9' }}
                  labelStyle={{ color: '#2dd4bf', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#2b7a78" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Depth distribution */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Depth distribution</h2>
            <span className="font-mono text-xs text-slate-400">/api/depth/analysis</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depthIntervals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="depth_regime" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '6px', color: '#f1f5f9' }}
                  labelStyle={{ color: '#d97706', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#936838" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Magnitude vs depth & Magnitude categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Magnitude vs depth */}
        <div className="lg:col-span-7 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Magnitude vs depth</h2>
            <span className="font-mono text-xs text-slate-400">/api/depth/analysis</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <XAxis type="number" dataKey="mag" name="Magnitude" domain={[4.5, 9.5]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="number" dataKey="depth" name="Depth (km)" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '6px', color: '#f1f5f9' }}
                />
                <Scatter data={scatterPoints} fill="#2dd4bf" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Magnitude categories */}
        <div className="lg:col-span-5 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#142338] mb-4">
            <h2 className="text-sm font-semibold text-slate-100">Magnitude categories</h2>
            <span className="font-mono text-xs text-slate-400">/api/magnitude/distribution</span>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-[#142338]">
                  <th className="pb-3 font-normal">Band</th>
                  <th className="pb-3 font-normal">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142338]">
                {magCategories.length > 0 ? (
                  magCategories.map((c, i) => (
                    <tr key={i} className="hover:bg-[#111d2e]/50 transition-colors">
                      <td className="py-2.5 text-slate-200">{c.band}</td>
                      <td className="py-2.5 text-teal-400">{c.count?.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  [1, 2, 3, 4, 5].map((_, idx) => (
                    <tr key={idx}>
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
