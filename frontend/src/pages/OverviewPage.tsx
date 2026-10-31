import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, Waves, Layers, TrendingUp, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { api } from '../services/api';
import { KPICard } from '../components/KPICard';
import type { GlobalKPIs, Earthquake } from '../types/earthquake';

interface OverviewPageProps {
  onNavigateToMap: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateToMap }) => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<GlobalKPIs | null>(null);
  const [yearlyTrend, setYearlyTrend] = useState<any[]>([]);
  const [magDistribution, setMagDistribution] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<Earthquake[]>([]);
  const [highestEvents, setHighestEvents] = useState<Earthquake[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getOverview();
        setKpis(data.kpis);
        setYearlyTrend(data.yearly_trend || []);
        setMagDistribution(data.magnitude_distribution || []);
        setRecentEvents(data.recent_events || []);
        setHighestEvents(data.highest_events || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load overview data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const MAG_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f97316', '#ef4444', '#a855f7'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Querying MongoDB Aggregations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/30 border border-rose-800 rounded-xl text-rose-300 max-w-xl mx-auto my-12 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
        <h4 className="font-semibold text-base">Error Loading Overview</h4>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111c30] to-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Academic Big Data Mining Project &bull; MongoDB Ingestion &amp; Analytics</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Global Seismic Activity Monitor
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-2 leading-relaxed">
              Real-world earthquake catalog ingestion from the USGS Comprehensive Catalog (2000–2025).
              Featuring high-efficiency MongoDB aggregation pipelines, spatial 2dsphere geospatial queries,
              and cross-regional comparative seismology.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToMap}
              className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-sky-500/25 transition"
            >
              <span>Explore Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Historical Events"
          value={kpis?.total_earthquakes.toLocaleString() || '0'}
          subtext="2000 - 2025 USGS Catalog"
          icon={Activity}
          color="sky"
        />
        <KPICard
          title="Average Magnitude"
          value={`M ${kpis?.avg_magnitude || '0'}`}
          subtext="Mean energy threshold M >= 5.2"
          icon={TrendingUp}
          color="emerald"
        />
        <KPICard
          title="Maximum Recorded"
          value={`M ${kpis?.max_magnitude || '0'}`}
          subtext="2011 Tohoku &amp; 2004 Sumatra"
          icon={ShieldAlert}
          color="rose"
        />
        <KPICard
          title="Average Focal Depth"
          value={`${kpis?.avg_depth_km || '0'} km`}
          subtext="Predominantly shallow crustal quakes"
          icon={Layers}
          color="amber"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 25-Year Trend Area Chart */}
        <div className="lg:col-span-2 bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Annual Earthquake Frequency Trend (2000–2025)</span>
              </h2>
              <p className="text-xs text-slate-400">Total global M &ge; 5.2 events per calendar year via MongoDB $group</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
              25 Years
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d42" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} Earthquakes`, 'Count']}
                />
                <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Magnitude Distribution via $bucket */}
        <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Magnitude Categorization</span>
            </h2>
            <p className="text-xs text-slate-400">Derived using MongoDB $bucket pipeline</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={magDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d42" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="magnitude_band" stroke="#94a3b8" tick={{ fontSize: 11 }} width={95} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any) => [`${val.toLocaleString()} events`, 'Volume']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {magDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={MAG_COLORS[index % MAG_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Records: Recent vs Major Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Historical Megathrust Events */}
        <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <h2 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Highest Historical Recorded Megathrust Events</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Historical record peaks in the 2000–2025 catalog</p>

          <div className="space-y-2.5">
            {highestEvents.map((ev) => (
              <div key={ev.event_id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-10 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-base flex items-center justify-center">
                    M{ev.magnitude.toFixed(1)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{ev.place}</h4>
                    <p className="text-xs text-slate-400">{ev.region_name} &bull; {ev.date_str}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">{ev.depth_km} km depth</span>
                  {ev.tsunami === 1 && (
                    <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Tsunami
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Catalog Earthquakes */}
        <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <h2 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
            <Waves className="w-4 h-4 text-sky-400" />
            <span>Latest Catalog Ingestion Samples</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Most recent verified earthquake events in MongoDB</p>

          <div className="space-y-2.5">
            {recentEvents.map((ev) => (
              <div key={ev.event_id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-10 rounded bg-sky-500/20 border border-sky-500/40 text-sky-400 font-mono font-bold text-base flex items-center justify-center">
                    M{ev.magnitude.toFixed(1)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{ev.place}</h4>
                    <p className="text-xs text-slate-400">{ev.region_name} &bull; {ev.date_str}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">{ev.depth_km} km</span>
                  <span className="block text-[10px] text-slate-400 font-mono">{ev.event_id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
