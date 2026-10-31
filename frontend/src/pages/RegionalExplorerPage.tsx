import React, { useEffect, useState } from 'react';
import { Compass, Cpu, AlertTriangle, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { api } from '../services/api';
import type { RegionalComparison } from '../types/earthquake';

export const RegionalExplorerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [regionalComparison, setRegionalComparison] = useState<RegionalComparison[]>([]);
  const [dbscanData, setDbscanData] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionalComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRegional() {
      try {
        setLoading(true);
        const [compRes, clusterRes] = await Promise.all([
          api.getRegionalComparison(),
          api.getDBSCANClusters(350, 15)
        ]);
        const comps = compRes.regional_comparison || [];
        setRegionalComparison(comps);
        if (comps.length > 0) setSelectedRegion(comps[0]);
        setDbscanData(clusterRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load regional data');
      } finally {
        setLoading(false);
      }
    }
    loadRegional();
  }, []);

  const REGION_COLORS = [
    '#38bdf8', '#34d399', '#fbbf24', '#f97316', '#ef4444',
    '#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#94a3b8'
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Aggregating Tectonic Regions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/30 border border-rose-800 rounded-xl text-rose-300 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Compass className="w-6 h-6 text-sky-400" />
          <span>Tectonic Regional Seismology &amp; Spatial Clustering</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Comparative seismological analysis across 10 global tectonic plate regimes and DBSCAN spatial density clusters.
        </p>
      </div>

      {/* Regional Volume Bar Chart */}
      <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Earthquake Concentration by Tectonic Zone (2000–2025)</span>
          </h2>
          <p className="text-xs text-slate-400">Total historical earthquake volume aggregated via MongoDB $lookup &amp; $group</p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalComparison} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d42" />
              <XAxis
                dataKey="region_name"
                stroke="#64748b"
                tick={{ fontSize: 9 }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                formatter={(val: any) => [`${val.toLocaleString()} events`, 'Volume']}
              />
              <Bar dataKey="total_events" radius={[4, 4, 0, 0]}>
                {regionalComparison.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional Comparison Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regionalComparison.map((r) => {
          const isSelected = selectedRegion?.region_id === r.region_id;
          return (
            <div
              key={r.region_id}
              onClick={() => setSelectedRegion(r)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-500/10'
                  : 'bg-[#121a2a] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{r.region_name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{r.region_id}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  r.hazard_level.includes('Extremely') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  r.hazard_level.includes('Very') ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                  'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}>
                  {r.hazard_level}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2 line-clamp-2">{r.tectonic_setting}</p>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Quakes</span>
                  <span className="text-xs font-bold text-white">{r.total_events.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Max Mag</span>
                  <span className="text-xs font-bold text-rose-400">M{r.max_magnitude}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg Depth</span>
                  <span className="text-xs font-bold text-sky-400">{r.avg_depth_km} km</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Data Mining: DBSCAN Spatial Clusters */}
      {dbscanData && (
        <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <span>Unsupervised Spatial Mining: DBSCAN Fault Clusters</span>
              </h2>
              <p className="text-xs text-slate-400">
                Algorithm: {dbscanData.algorithm} &bull; Radius: {dbscanData.parameters?.eps_km} km &bull; Min Samples: {dbscanData.parameters?.min_samples}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {dbscanData.total_clusters_identified} Distinct Seismic Fault Clusters
              </span>
              <span className="block text-[10px] text-slate-400">
                {dbscanData.total_analyzed_events} high-energy events analyzed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dbscanData.clusters?.slice(0, 6).map((c: any) => (
              <div key={c.cluster_id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 font-mono">Cluster #{c.cluster_id + 1}</span>
                  <span className="font-mono text-white font-semibold">{c.size} Events</span>
                </div>
                <p className="font-semibold text-slate-200">{c.dominant_region}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Centroid: {c.center_lat}&deg;N, {c.center_lon}&deg;E
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Max: <b className="text-rose-400 font-mono">M{c.max_magnitude}</b></span>
                  <span>Avg Depth: <b className="text-sky-400 font-mono">{c.avg_depth_km} km</b></span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300">
            <b>Descriptive Boundary Mining:</b> Unsupervised DBSCAN density clustering detects geographic epicenter alignments
            without prior geological boundary labels. Identified clusters closely match the Marianas, Kuril-Kamchatka, Java-Sumatra,
            and Andean Wadati-Benioff subduction arcs. (Note: These spatial patterns represent historical density alignments, not earthquake forecasts).
          </div>
        </div>
      )}
    </div>
  );
};
