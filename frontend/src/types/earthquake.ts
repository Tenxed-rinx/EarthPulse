export interface Earthquake {
  event_id: string;
  magnitude: number;
  mag_type: string;
  place: string;
  event_time?: string;
  timestamp_ms?: number;
  date_str: string;
  depth_km: number;
  region_id?: string;
  region_name: string;
  magnitude_band?: string;
  depth_band?: string;
  tsunami: number;
  significance?: number;
  location: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
  distance_km?: number;
}

export interface GlobalKPIs {
  total_earthquakes: number;
  avg_magnitude: number;
  max_magnitude: number;
  min_magnitude: number;
  avg_depth_km: number;
  total_tsunami_alerts: number;
}

export interface RegionMetadata {
  region_id: string;
  region_name: string;
  tectonic_setting: string;
  hazard_level: string;
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
  description: string;
}

export interface RegionalComparison {
  region_id: string;
  region_name: string;
  hazard_level: string;
  tectonic_setting: string;
  total_events: number;
  avg_magnitude: number;
  max_magnitude: number;
  avg_depth_km: number;
  tsunami_count: number;
}

export interface HotspotCell {
  grid_id: string;
  earthquake_count: number;
  avg_magnitude: number;
  max_magnitude: number;
  avg_depth_km: number;
  min_depth_km: number;
  max_depth_km: number;
  centroid: [number, number];
  bounds: [number, number, number, number];
  primary_region: string;
  seismic_density_tier: string;
}

export interface UserAccount {
  username: string;
  email: string;
  role: 'viewer' | 'analyst' | 'admin';
  full_name?: string;
}
