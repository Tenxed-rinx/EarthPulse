import React, { useEffect, useState } from 'react';
import { BarChart2, ScatterChart as ScatterIcon, Layers, Info, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { api } from '../services/api';

export const MagnitudeDepthPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [depthIntervals, setDepthIntervals] = useState<any[]>([]);
  const [scatterSample, setScatterSample] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoading(true);
        const depthRes = await api.getDepthAnalysis();
        setDepthIntervals(depthRes.depth_intervals || []);
        setScatterSample(depthRes.scatter_sample || []);
        setStatsData(depthRes.statistical_correlation || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load depth-magnitude analytics');
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, []);

  const DEPTH_COLORS = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Computing Seismological Correlations...</p>
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
          <BarChart2 className="w-6 h-6 text-sky-400" />
          <span>Magnitude &amp; Focal Depth Statistical Mining</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Evaluating energy magnitude scaling and lithospheric depth stratification across subduction and crustal zones.
        </p>
      </div>

      {/* Statistical Summary Cards */}
      {statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pearson Correlation (r)</span>
            <h3 className="text-2xl font-bold text-sky-400 font-mono mt-1">
              {statsData.pearson_correlation}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">p-value: {statsData.pearson_p_value.toExponential(2)}</p>
          </div>

          <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Spearman Rank (&rho;)</span>
            <h3 className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {statsData.spearman_rank_correlation}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Non-parametric rank monotonic test</p>
          </div>

          <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Linear Regression Fit</span>
            <h3 className="text-lg font-bold text-emerald-400 font-mono mt-1 truncate">
              {statsData.linear_regression?.formula}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">R&sup2; = {statsData.linear_regression?.r_squared}</p>
          </div>

          <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Median Focal Depth</span>
            <h3 className="text-2xl font-bold text-rose-400 font-mono mt-1">
              {statsData.depth_statistics_km?.median} km
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Mean: {statsData.depth_statistics_km?.mean} km (&sigma; = {statsData.depth_statistics_km?.std_dev})</p>
          </div>
        </div>
      )}

      {/* Main Charts: Scatter Plot & Depth Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scatter Plot: Magnitude vs Depth */}
        <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ScatterIcon className="w-4 h-4 text-sky-400" />
              <span>Magnitude vs. Focal Depth Scatter Distribution</span>
            </h2>
            <p className="text-xs text-slate-400">Randomized sample of 600 earthquakes demonstrating depth dispersion</p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d42" />
                <XAxis
                  type="number"
                  dataKey="magnitude"
                  name="Magnitude"
                  domain={[5.0, 9.5]}
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  unit="M"
                />
                <YAxis
                  type="number"
                  dataKey="depth_km"
                  name="Depth"
                  reversed={true} // Seismological convention: surface at top, deep downwards
                  domain={[0, 700]}
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  unit="km"
                />
                <ZAxis range={[25, 25]} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded text-xs text-slate-200">
                        <p className="font-bold text-sky-400">M{d.magnitude} - {d.place}</p>
                        <p>Depth: <span className="font-mono text-white">{d.depth_km} km</span></p>
                        <p>Date: <span className="text-slate-400">{d.date_str}</span></p>
                      </div>
                    );
                  }}
                />
                <Scatter name="Earthquakes" data={scatterSample} fill="#38bdf8" fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2 italic">
            * Note: Y-axis is inverted following seismological convention (surface at 0 km down to mantle depths at 700 km).
          </p>
        </div>

        {/* Depth Distribution via $bucket */}
        <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Depth Stratification ($bucket Intervals)</span>
            </h2>
            <p className="text-xs text-slate-400">Seismic event volume categorized by crustal and mantle depth layers</p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depthIntervals} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d42" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="interval" stroke="#94a3b8" tick={{ fontSize: 10 }} width={125} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any) => [`${val.toLocaleString()} events`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {depthIntervals.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DEPTH_COLORS[index % DEPTH_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Descriptive Finding Callout */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-white">Geophysical Interpretation &amp; Mining Insights</h4>
          <p className="leading-relaxed">
            The calculated Pearson correlation coefficient (r &approx; -0.06) confirms that earthquake magnitude is largely
            independent of focal depth across the lithosphere. However, depth classification reveals that over 75% of all recorded
            earthquakes nucleate in the shallow crust (0–70 km). Crucially, the most destructive megathrust events (M &ge; 8.0)
            occur exclusively at shallow depths where locked tectonic fault asperities release catastrophic elastic strain directly
            adjacent to oceanic trenches.
          </p>
        </div>
      </div>
    </div>
  );
};
