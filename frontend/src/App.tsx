import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
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
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [recordCount, setRecordCount] = useState<number>(26170);

  // Initialize Auth & Live Count on mount
  useEffect(() => {
    // Check health & count
    api.getHealth().then((res) => {
      if (res.mongodb?.earthquake_documents) {
        setRecordCount(res.mongodb.earthquake_documents);
      }
    }).catch(console.error);

    // Verify stored token
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

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setActiveTab('admin')}
        recordCount={recordCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewPage onNavigateToMap={() => setActiveTab('map')} />
        )}
        {activeTab === 'map' && <MapPage />}
        {activeTab === 'temporal' && <TemporalPage />}
        {activeTab === 'mag_depth' && <MagnitudeDepthPage />}
        {activeTab === 'regional' && <RegionalExplorerPage />}
        {activeTab === 'data_quality' && <DataQualityPage />}
        {activeTab === 'admin' && (
          <AdminPage user={user} onUserChange={setUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#080c14] border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <b>EarthPulse &bull; Big Data Mining Platform</b> &bull; MongoDB Community Edition &amp; Python Flask &bull; USGS ComCat
          </p>
          <p className="font-mono text-slate-600">
            Database: <span className="text-slate-400">earthpulse_db</span> &bull; 26,170 Documents Indexed
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
