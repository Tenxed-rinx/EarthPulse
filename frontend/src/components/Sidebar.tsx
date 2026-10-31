import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { UserAccount } from '../types/earthquake';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserAccount | null;
}

export const navItems = [
  { id: 'overview', label: 'Global Overview', category: 'SEISMIC INTELLIGENCE', title: 'Global Seismic Overview & Catastrophic Event Monitoring' },
  { id: 'map', label: 'Earthquake Map', category: 'GEOSPATIAL EXPLORER', title: 'Interactive Seismic Map & Proximity Search' },
  { id: 'safety', label: 'Safety & Education', category: 'PREPAREDNESS & ARTICLES', title: 'Earthquake Safety Protocols, Case Studies & Emergency Relief' },
  { id: 'temporal', label: 'Temporal Analysis', category: 'TIME-SERIES TRENDS', title: 'Historical Frequency & Multi-Year Activity Trends' },
  { id: 'mag_depth', label: 'Magnitude & Depth', category: 'LITHOSPHERIC DYNAMICS', title: 'Focal Depth Classification & Energy Release Patterns' },
  { id: 'regional', label: 'Regional Explorer', category: 'TECTONIC BELTS', title: 'Global Plate Boundary Activity & Hotspot Analysis' },
  { id: 'data_quality', label: 'Data Quality & Big Data', category: 'DATA GOVERNANCE', title: 'Dataset Telemetry, Index Optimization & Audit Trail' },
  { id: 'admin', label: 'Users & Admin', category: 'SYSTEM ADMINISTRATION', title: 'Access Control, Data Pipelines & Ingestion Logs' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user }) => {
  const openInNewTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    window.open(url, '_blank');
  };

  const currentRole = user?.role === 'admin' 
    ? 'Administrator' 
    : user?.role === 'analyst' 
    ? 'Researcher' 
    : 'Researcher';

  return (
    <aside className="w-64 flex-shrink-0 bg-[#070c14] border-r border-[#121b2a] flex flex-col justify-between p-6 select-none min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="mb-8 cursor-pointer" onClick={() => setActiveTab('overview')}>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            EarthPulse
          </h1>
          <p className="text-xs text-slate-400 mt-1">USGS seismic data mining</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`group flex items-center justify-between rounded-r-md transition-colors relative ${
                  isActive
                    ? 'bg-[#111d2e] border-l-2 border-teal-400 text-white font-medium'
                    : 'text-[#8899aa] hover:text-slate-200 hover:bg-[#0c1422]'
                }`}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm block"
                >
                  {item.label}
                </a>

                {/* Open in new tab button */}
                <button
                  onClick={(e) => openInNewTab(e, item.id)}
                  title="Open in new tab"
                  className="px-3 py-2 text-slate-500 hover:text-teal-400 opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Role and Database indicator badge at bottom of sidebar */}
      <div className="mt-8 pt-4 border-t border-[#121b2a]">
        <div className="border border-[#162338] rounded-lg p-3 bg-[#0a101d] text-xs">
          <div className="text-slate-300 font-medium">Role: {currentRole}</div>
          <div className="text-slate-400 font-mono text-[11px] mt-0.5">earthpulse_db</div>
        </div>
      </div>
    </aside>
  );
};
