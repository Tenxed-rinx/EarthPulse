import React from 'react';
import { Activity, Globe, Calendar, BarChart2, Compass, ShieldCheck, Database, LogIn, LogOut, User } from 'lucide-react';
import type { UserAccount } from '../types/earthquake';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserAccount | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  recordCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenAuth,
  recordCount
}) => {
  const navItems = [
    { id: 'overview', label: 'Global Overview', icon: Activity },
    { id: 'map', label: 'Seismic Map', icon: Globe },
    { id: 'temporal', label: 'Temporal Trends', icon: Calendar },
    { id: 'mag_depth', label: 'Magnitude & Depth', icon: BarChart2 },
    { id: 'regional', label: 'Regional Explorer', icon: Compass },
    { id: 'data_quality', label: 'Big Data & Quality', icon: Database },
    { id: 'admin', label: 'Admin & Access', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0e1626]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">EARTH<span className="text-sky-400">PULSE</span></span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60">BDM Platform</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Global Earthquake Mining & Analytics</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Telemetry Badge & User Auth */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-mono font-semibold">{recordCount.toLocaleString()}</span>
              <span className="text-slate-400 text-[11px]">in MongoDB</span>
            </div>

            {user ? (
              <div className="flex items-center space-x-2">
                <div className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-xs flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-slate-200 font-medium">{user.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                    user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : user.role === 'analyst'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
