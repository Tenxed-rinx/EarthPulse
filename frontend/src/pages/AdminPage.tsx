import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, RefreshCw, Key, Database, Download, CheckCircle, Users } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import type { UserAccount } from '../types/earthquake';

interface AdminPageProps {
  user: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ user, onUserChange }) => {
  // Login / Register state
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Admin Actions state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Load db stats and user list if admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      api.getDbStats().then(setDbStats).catch(console.error);
      api.getUsers().then((res) => setUsersList(res.users || [])).catch(console.error);
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isRegistering) {
        const res = await api.register({
          username,
          password,
          email,
          full_name: fullName,
          role: 'analyst'
        });
        setAuthToken(res.token);
        onUserChange(res.user);
      } else {
        const res = await api.login({ username, password });
        setAuthToken(res.token);
        onUserChange(res.user);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRefreshSummaries = async () => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await api.refreshSummaries();
      setActionMessage(res.message || 'Summaries recomputed successfully!');
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (targetUsername: string, newRole: string) => {
    try {
      await api.updateUserRole(targetUsername, newRole);
      const res = await api.getUsers();
      setUsersList(res.users || []);
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-sky-400" />
          <span>Role-Based Authentication &amp; Administrative Console</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Secure JWT access control with Viewer, Analyst, and Administrator permission tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Auth Card */}
        <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>{user ? 'Active Session' : isRegistering ? 'Create Account' : 'Sign In'}</span>
            </h2>
            {user && (
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                user.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                user.role === 'analyst' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                'bg-slate-700 text-slate-300'
              }`}>
                {user.role}
              </span>
            )}
          </div>

          {user ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <p><span className="text-slate-400">Username:</span> <b className="text-white font-mono">{user.username}</b></p>
                <p><span className="text-slate-400">Email:</span> <span className="text-slate-300">{user.email}</span></p>
                <p><span className="text-slate-400">Authorization Tier:</span> <b className="text-sky-400 uppercase">{user.role}</b></p>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 text-sky-300 text-[11px] leading-relaxed">
                <b>Role Permissions:</b>
                {user.role === 'admin' && ' Full administrative rights: trigger ETL pipelines, re-aggregate summaries, and manage user roles.'}
                {user.role === 'analyst' && ' Researcher rights: advanced filtering, statistical scatter analysis, and direct CSV dataset export.'}
                {user.role === 'viewer' && ' Public viewer rights: explore global map, view historical KPIs, and browse analytics.'}
              </div>

              <button
                onClick={() => {
                  setAuthToken(null);
                  onUserChange(null);
                }}
                className="w-full py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold border border-rose-500/30 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {authError && (
                <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-[11px]">
                  {authError}
                </div>
              )}

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white font-mono focus:border-sky-500"
                />
              </div>

              {isRegistering && (
                <>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:border-sky-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white font-mono focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition flex items-center justify-center space-x-1"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isRegistering ? 'Register Account' : 'Authenticate'}</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sky-400 hover:underline text-[11px]"
                >
                  {isRegistering ? 'Already have an account? Sign in' : 'New researcher? Create an account'}
                </button>
              </div>

              {/* Seed Credentials Guide */}
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Default Seed Accounts:</p>
                <p>&bull; <b>admin</b> / <code>admin123</code> (Administrator)</p>
                <p>&bull; <b>analyst</b> / <code>analyst123</code> (Researcher)</p>
                <p>&bull; <b>viewer</b> / <code>viewer123</code> (Public Viewer)</p>
              </div>
            </form>
          )}
        </div>

        {/* Right Columns: Admin Controls & DB Engine */}
        <div className="lg:col-span-2 space-y-6">
          {user?.role === 'admin' ? (
            <>
              {/* Admin Actions Card */}
              <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>Administrator Pipeline Controls</span>
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Admin Exclusive
                  </span>
                </div>

                {actionMessage && (
                  <div className={`p-3 rounded text-xs flex items-center space-x-2 ${
                    actionMessage.startsWith('Error')
                      ? 'bg-rose-950/40 border border-rose-800 text-rose-300'
                      : 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  }`}>
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{actionMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-white">Re-compute Aggregation Pipelines</h3>
                    <p className="text-xs text-slate-400">
                      Executes native MongoDB aggregations across all 26,170 events to regenerate daily, monthly,
                      magnitude bands, and hotspot cell collections.
                    </p>
                    <button
                      onClick={handleRefreshSummaries}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center space-x-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                      <span>Execute Aggregation Refresh</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-white">Export Filtered CSV Dataset</h3>
                    <p className="text-xs text-slate-400">
                      Streams analytical records directly from MongoDB 'earthquakes' for local modeling and reporting.
                    </p>
                    <a
                      href={api.getExportUrl()}
                      download
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Filtered CSV</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Low-Level DB Engine Telemetry */}
              {dbStats && (
                <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span>MongoDB Engine Diagnostics (dbStats)</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                    <div className="p-3 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Data Size</span>
                      <span className="text-sm font-bold text-white">{dbStats.data_size_mb} MB</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Storage On Disk</span>
                      <span className="text-sm font-bold text-white">{dbStats.storage_size_mb} MB</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Active Indexes</span>
                      <span className="text-sm font-bold text-sky-400">{dbStats.indexes_count}</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Index RAM Size</span>
                      <span className="text-sm font-bold text-emerald-400">{dbStats.index_size_mb} MB</span>
                    </div>
                  </div>
                </div>
              )}

              {/* User Roles Delegation Table */}
              <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>User Role Management</span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Username</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Current Role</th>
                        <th className="py-2 px-3">Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {usersList.map((u) => (
                        <tr key={u.username}>
                          <td className="py-2 px-3 font-bold text-slate-200">{u.username}</td>
                          <td className="py-2 px-3 text-slate-400">{u.email}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-sky-400">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.username, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-0.5"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="analyst">Analyst</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Restricted Callout for Non-Admins */
            <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Administrator Access Required</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Administrative actions such as pipeline triggers, low-level engine diagnostics, and user role management
                require an active session with the <b>admin</b> role.
              </p>
              <div className="p-3 bg-slate-900/60 rounded-lg max-w-sm mx-auto border border-slate-800 text-xs text-slate-300">
                To sign in as administrator, authenticate on the left using:
                <br /><code className="text-sky-400 font-bold">admin</code> / <code className="text-sky-400 font-bold">admin123</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
