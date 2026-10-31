import React, { useEffect, useState } from 'react';
import { Sidebar, navItems } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { MapPage } from './pages/MapPage';
import { TemporalPage } from './pages/TemporalPage';
import { MagnitudeDepthPage } from './pages/MagnitudeDepthPage';
import { RegionalExplorerPage } from './pages/RegionalExplorerPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { AdminPage } from './pages/AdminPage';
import { api, getAuthToken, setAuthToken } from './services/api';
import type { UserAccount } from './types/earthquake';

export const App: React.FC = () => {
  // Support real URL Hash routing so opening in a new tab immediately loads that page
  const getInitialTab = (): string => {
    const hash = window.location.hash.replace('#', '').trim();
    const validTabs = ['overview', 'map', 'temporal', 'mag_depth', 'regional', 'data_quality', 'admin'];
    return validTabs.includes(hash) ? hash : 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [user, setUser] = useState<UserAccount | null>(null);

  // Sync hash changes (e.g. browser back/forward or new tab opens with #regional)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['overview', 'map', 'temporal', 'mag_depth', 'regional', 'data_quality', 'admin'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Auth verify on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe().then((res) => {
        if (res.user) {
          setUser({
            username: res.user.sub,
            email: res.user.email,
            role: res.user.role,
            full_name: res.user.full_name
          });
        }
      }).catch(() => {
        setAuthToken(null);
        setUser(null);
      });
    }
  }, []);

  // Find active item metadata for top category badge & headline
  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="flex min-h-screen bg-[#070c14] text-slate-100 font-sans antialiased overflow-x-hidden">
      {/* Fixed Left Sidebar matching screenshot */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} user={user} />

      {/* Main Content Area */}
      <main className="flex-1 bg-[#090e18] p-8 lg:p-12 overflow-y-auto min-h-screen flex flex-col justify-between">
        <div>
          {/* Header Badge & Title matching screenshots */}
          <div className="mb-6">
            <div className="text-xs font-semibold tracking-wider text-teal-400 uppercase mb-1.5 font-mono">
              {currentNav.category}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {currentNav.title}
            </h1>
          </div>

          {/* Active View */}
          <div>
            {activeTab === 'overview' && (
              <OverviewPage onNavigateToMap={() => handleTabChange('map')} />
            )}
            {activeTab === 'map' && <MapPage />}
            {activeTab === 'temporal' && <TemporalPage />}
            {activeTab === 'mag_depth' && <MagnitudeDepthPage />}
            {activeTab === 'regional' && <RegionalExplorerPage />}
            {activeTab === 'data_quality' && <DataQualityPage />}
            {activeTab === 'admin' && (
              <AdminPage user={user} onUserChange={setUser} />
            )}
          </div>
        </div>

        {/* Footer notice matching wireframe */}
        <div className="mt-12 pt-6 border-t border-[#121c2d]">
          <p className="font-mono text-xs text-slate-400">
            Layout preview. Values stay empty until bound to the Flask API.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
