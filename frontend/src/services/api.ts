const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('earthpulse_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('earthpulse_token', token);
  } else {
    localStorage.removeItem('earthpulse_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => request<any>('/health'),

  // Overview & KPIs
  getOverview: () => request<any>('/overview'),

  // Earthquakes with filters
  getEarthquakes: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, String(v));
      }
    });
    return request<any>(`/earthquakes?${q.toString()}`);
  },

  getEarthquakeDetail: (eventId: string) => request<any>(`/earthquakes/${eventId}`),

  // Geospatial $geoNear
  getNearby: (lat: number, lon: number, maxDistanceKm: number = 500, minMag: number = 5.0) =>
    request<any>(`/nearby?lat=${lat}&lon=${lon}&max_distance_km=${maxDistanceKm}&min_mag=${minMag}`),

  // Temporal
  getYearlyTrends: () => request<any>('/trends/yearly'),
  getMonthlyTrends: (year?: number, regionId?: string) => {
    const q = new URLSearchParams();
    if (year) q.append('year', String(year));
    if (regionId && regionId !== 'ALL') q.append('region_id', regionId);
    return request<any>(`/trends/monthly?${q.toString()}`);
  },

  // Magnitude & Depth
  getMagnitudeDistribution: () => request<any>('/magnitude/distribution'),
  getDepthAnalysis: () => request<any>('/depth/analysis'),

  // Regions & Hotspots
  getRegions: () => request<any>('/regions'),
  getRegionalComparison: () => request<any>('/regions/comparison'),
  getHotspots: (tier?: string) => request<any>(`/hotspots${tier ? `?tier=${tier}` : ''}`),

  // Advanced Mining
  getDBSCANClusters: (epsKm: number = 350, minSamples: number = 15) =>
    request<any>(`/clustering/dbscan?eps_km=${epsKm}&min_samples=${minSamples}`),

  // Data Quality & Logs
  getDataQuality: () => request<any>('/data-quality'),
  getIngestionLogs: () => request<any>('/ingestion/logs'),

  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: any) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  getUsers: () => request<any>('/auth/users'),
  updateUserRole: (username: string, role: string) =>
    request<any>(`/auth/users/${username}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  // Admin
  refreshSummaries: () => request<any>('/admin/refresh-summaries', { method: 'POST' }),
  reloadData: () => request<any>('/admin/reload-data', { method: 'POST' }),
  getDbStats: () => request<any>('/admin/db-stats'),

  // CSV Export URL
  getExportUrl: (regionId?: string, minMag?: number) => {
    const q = new URLSearchParams();
    if (regionId && regionId !== 'ALL') q.append('region_id', regionId);
    if (minMag) q.append('min_mag', String(minMag));
    return `${API_BASE}/export/csv?${q.toString()}`;
  }
};
