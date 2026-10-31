import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Cell
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
        
        // Normalize magnitude distribution data
        const rawMags = mRes.magnitude_distribution || [];
        const normalizedMags = rawMags.map((m: any) => ({
          band: m.magnitude_band?.replace(' (', '\n(') || m.range || 'M5+',
          shortBand: m.magnitude_band?.split(' (')[0] || 'M5+',
          count: m.count || 0,
          avgDepth: m.avg_depth_km,
          tsunamis: m.tsunami_count || 0
        }));
        setMagDist(normalizedMags);

        // Normalize depth intervals data
        const rawDepths = dRes.depth_intervals || [];
        const normalizedDepths = rawDepths.map((d: any) => ({
          interval: d.interval?.replace(' km (', '\n(') || `${d.lower_depth_km}km`,
          shortInterval: d.interval?.split(' (')[0] || `${d.lower_depth_km}km`,
          count: d.count || 0,
          avgMag: d.avg_magnitude
        }));
        setDepthIntervals(normalizedDepths);

        // Scatter plot sample
        const rawScatter = dRes.scatter_sample || [];
        setScatterSample(rawScatter.map((pt: any) => ({
          mag: pt.magnitude,
          depth: pt.depth_km,
          place: pt.place
        })));
      } catch (err) {
        console.error('Failed to load depth/magnitude data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Row: Magnitude distribution & Depth distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Magnitude distribution */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#142338] mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Earthquakes by Magnitude Band</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Distribution of moderate to catastrophic seismic events</p>
            </div>
            <span className="font-mono text-[11px] text-slate-500">26,170 Events</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={magDist} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <XAxis 
                  dataKey="shortBand" 
                  stroke="#475569" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  interval={0}
                />
                <YAxis 
                  stroke="#475569" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '8px', color: '#f1f5f9' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} events`, 'Frequency']}
                  labelStyle={{ color: '#2dd4bf', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#2b7a78" radius={[4, 4, 0, 0]}>
                  {magDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? '#ef4444' : index === 2 ? '#f97316' : '#2b7a78'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Depth distribution */}
        <div className="lg:col-span-6 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#142338] mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Earthquakes by Focal Depth</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Lithospheric crustal vs mantle subduction zones</p>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Focal Depths</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depthIntervals} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <XAxis 
                  dataKey="shortInterval" 
                  stroke="#475569" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#475569" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '8px', color: '#f1f5f9' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} events`, 'Frequency']}
                  labelStyle={{ color: '#d97706', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#936838" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Magnitude vs depth & Magnitude categories table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Magnitude vs depth Scatter Plot */}
        <div className="lg:col-span-7 bg-[#0d1626] border border-[#142338] rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#142338] mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Magnitude vs. Focal Depth (km)</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Megaquakes occur in shallow brittle crust (0–70 km)</p>
            </div>
            <span className="font-mono text-[11px] text-teal-400">Pearson r = -0.057</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis 
                  type="number" 
                  dataKey="mag" 
                  name="Magnitude" 
                  domain={[5.0, 9.5]} 
                  stroke="#475569" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  unit="M"
                />
                <YAxis 
                  type="number" 
                  dataKey="depth" 
                  name="Depth" 
                  stroke="#475569" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  unit="km"
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0c1422', borderColor: '#192841', borderRadius: '8px', color: '#f1f5f9' }}
                  formatter={(value: any, name: any) => [name === 'Magnitude' ? `M ${value}` : `${value} km`, name]}
                />
                <Scatter data={scatterSample} fill="#2dd4bf" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Magnitude categories table */}
        <div className="lg:col-span-5 bg-[#0d1626] border border-[#142338] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#142338] mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Severity Breakdown</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Recorded historical events by category</p>
              </div>
              <span className="font-mono text-[11px] text-slate-500">Summary</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-[#142338]">
                    <th className="pb-3 font-medium">Band</th>
                    <th className="pb-3 font-medium text-right">Count</th>
                    <th className="pb-3 font-medium text-right">Avg Depth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#142338]">
                  {magDist.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#111d2e]/50 transition-colors">
                      <td className="py-3 text-slate-200 font-sans font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${idx === 3 ? 'bg-purple-500' : idx === 2 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-teal-500'}`} />
                        <span>{item.shortBand}</span>
                      </td>
                      <td className="py-3 text-teal-300 font-bold text-right">{item.count.toLocaleString()}</td>
                      <td className="py-3 text-slate-400 text-right">{item.avgDepth ? `${item.avgDepth.toFixed(1)} km` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#142338] text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Total Catastrophic Events:</span>
            <span className="text-red-400 font-bold">27 Events (M 8.0+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
