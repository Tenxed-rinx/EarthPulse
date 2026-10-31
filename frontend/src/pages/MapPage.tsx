import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Filter, Layers, RefreshCw, X, Radio } from 'lucide-react';
import { api } from '../services/api';
import type { Earthquake, RegionMetadata } from '../types/earthquake';

export const MapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const earthquakeLayerRef = useRef<L.LayerGroup | null>(null);
  const nearbyLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotLayerRef = useRef<L.LayerGroup | null>(null);

  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [regions, setRegions] = useState<RegionMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Earthquake | null>(null);

  // Filters
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [minMag, setMinMag] = useState<number>(5.5);
  const [tsunamiOnly, setTsunamiOnly] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);
  const [geoNearMode, setGeoNearMode] = useState(false);
  const [nearbyQuakes, setNearbyQuakes] = useState<Earthquake[]>([]);
  const [searchRadiusKm, setSearchRadiusKm] = useState(600);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [15.0, 110.0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 14,
      worldCopyJump: true
    });

    // Dark Matter tile layer for scientific aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    earthquakeLayerRef.current = L.layerGroup().addTo(map);
    nearbyLayerRef.current = L.layerGroup().addTo(map);
    hotspotLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Load initial regions
    api.getRegions().then((data) => setRegions(data.regions || [])).catch(() => {});

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Fetch Earthquakes when filters change
  const fetchMapData = async () => {
    try {
      setLoading(true);
      const res = await api.getEarthquakes({
        limit: 400,
        min_mag: minMag,
        region_id: selectedRegion,
        tsunami: tsunamiOnly ? 1 : undefined,
        sort_by: 'magnitude',
        order: 'desc'
      });
      setEarthquakes(res.earthquakes || []);
    } catch (err) {
      console.error('Error fetching map earthquakes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [selectedRegion, minMag, tsunamiOnly]);

  // 3. Render Earthquakes on Map
  useEffect(() => {
    if (!earthquakeLayerRef.current || !mapInstanceRef.current) return;

    earthquakeLayerRef.current.clearLayers();

    earthquakes.forEach((eq) => {
      const coords = eq.location?.coordinates;
      if (!coords || coords.length < 2) return;
      const [lon, lat] = coords;

      // Color and size by magnitude
      const mag = eq.magnitude;
      let color = '#38bdf8'; // < 6.0
      let radius = 5;

      if (mag >= 8.0) {
        color = '#d946ef'; // Great 8.0+
        radius = 14;
      } else if (mag >= 7.0) {
        color = '#ef4444'; // Major 7.0+
        radius = 11;
      } else if (mag >= 6.0) {
        color = '#f97316'; // Strong 6.0+
        radius = 8;
      } else {
        color = '#eab308'; // Moderate 5.2 - 5.9
        radius = 6;
      }

      const circle = L.circleMarker([lat, lon], {
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.75
      });

      circle.on('click', () => {
        setSelectedEvent(eq);
      });

      circle.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <b>M${mag.toFixed(1)}</b> &bull; ${eq.place}<br/>
          Depth: ${eq.depth_km} km | Date: ${eq.date_str}
        </div>
      `, { sticky: true });

      circle.addTo(earthquakeLayerRef.current!);
    });
  }, [earthquakes]);

  // 4. Hotspots Layer Toggle
  useEffect(() => {
    if (!hotspotLayerRef.current) return;
    hotspotLayerRef.current.clearLayers();

    if (showHotspots) {
      api.getHotspots('ALL').then((data) => {
        const spots = data.hotspots || [];
        spots.forEach((h: any) => {
          if (!h.centroid || h.centroid.length < 2) return;
          const [lon, lat] = h.centroid;
          const marker = L.circleMarker([lat, lon], {
            radius: Math.min(22, Math.max(8, h.earthquake_count / 15)),
            fillColor: '#6366f1',
            color: '#a5b4fc',
            weight: 1.5,
            opacity: 0.8,
            fillOpacity: 0.35
          });
          marker.bindTooltip(`
            <b>Hotspot Cell: ${h.grid_id}</b><br/>
            Seismic Concentration: ${h.earthquake_count} earthquakes<br/>
            Avg Magnitude: M${h.avg_magnitude} | Max: M${h.max_magnitude}<br/>
            Density Tier: <b>${h.seismic_density_tier}</b>
          `);
          marker.addTo(hotspotLayerRef.current!);
        });
      }).catch(console.error);
    }
  }, [showHotspots]);

  // 5. Handle Click on Map for $geoNear Nearby Search
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (!geoNearMode) return;

      const { lat, lng } = e.latlng;
      if (!nearbyLayerRef.current) return;
      nearbyLayerRef.current.clearLayers();

      // Draw search circle
      const radiusMeters = searchRadiusKm * 1000;
      L.circle([lat, lng], {
        radius: radiusMeters,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(nearbyLayerRef.current);

      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-pin',
          html: '<div style="background-color: #38bdf8; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #38bdf8;"></div>'
        })
      }).addTo(nearbyLayerRef.current);

      try {
        const res = await api.getNearby(lat, lng, searchRadiusKm, minMag);
        const nearby = res.nearby_earthquakes || [];
        setNearbyQuakes(nearby);

        nearby.forEach((eq: Earthquake) => {
          const coords = eq.location?.coordinates;
          if (!coords || coords.length < 2) return;
          const [lon, latQ] = coords;

          const m = L.circleMarker([latQ, lon], {
            radius: 7,
            fillColor: '#10b981',
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 0.9
          });

          m.bindPopup(`
            <div style="font-size: 12px;">
              <b>M${eq.magnitude.toFixed(1)}</b> - ${eq.place}<br/>
              <b>Distance:</b> ${eq.distance_km} km away<br/>
              <b>Depth:</b> ${eq.depth_km} km &bull; ${eq.date_str}
            </div>
          `);

          m.addTo(nearbyLayerRef.current!);
        });
      } catch (err) {
        console.error('Failed to run $geoNear:', err);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [geoNearMode, searchRadiusKm, minMag]);

  return (
    <div className="space-y-4">
      {/* Map Control Toolbar */}
      <div className="bg-[#121a2a] border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Global Regions (26,170 Quakes)</option>
              {regions.map((r) => (
                <option key={r.region_id} value={r.region_id}>
                  {r.region_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <span>Min Mag:</span>
            <span className="font-mono text-amber-400 font-bold">M{minMag.toFixed(1)}+</span>
            <input
              type="range"
              min="5.2"
              max="7.5"
              step="0.1"
              value={minMag}
              onChange={(e) => setMinMag(parseFloat(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={tsunamiOnly}
              onChange={(e) => setTsunamiOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Tsunami Warnings Only</span>
          </label>
        </div>

        {/* Feature Toggles Group */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
              showHotspots
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hotspot Cells</span>
          </button>

          <button
            onClick={() => {
              setGeoNearMode(!geoNearMode);
              if (nearbyLayerRef.current) nearbyLayerRef.current.clearLayers();
              setNearbyQuakes([]);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
              geoNearMode
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{geoNearMode ? 'Click Map to Query ($geoNear)' : 'Find Nearby Quakes'}</span>
          </button>

          <button
            onClick={fetchMapData}
            title="Refresh map"
            className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Geospatial Mode Alert Banner */}
      {geoNearMode && (
        <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-lg p-3 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
            <span>
              <b>Interactive $geoNear Mode Active:</b> Click anywhere on the map to search MongoDB using geospatial 2dsphere indexing.
              Search radius: <b>{searchRadiusKm} km</b>.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Radius:</span>
            <select
              value={searchRadiusKm}
              onChange={(e) => setSearchRadiusKm(parseInt(e.target.value))}
              className="bg-slate-900 border border-emerald-700/60 text-emerald-300 rounded px-2 py-0.5"
            >
              <option value="300">300 km</option>
              <option value="600">600 km</option>
              <option value="1200">1200 km</option>
            </select>
          </div>
        </div>
      )}

      {/* Map Canvas and Drawer Container */}
      <div className="relative w-full h-[72vh] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Magnitude Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] bg-[#0f172a]/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs shadow-xl space-y-1.5">
          <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Magnitude Scale</p>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#d946ef] border border-white"></span>
            <span className="text-slate-300 font-mono">M 8.0+ &bull; Great</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-300 font-mono">M 7.0 - 7.9 &bull; Major</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span className="text-slate-300 font-mono">M 6.0 - 6.9 &bull; Strong</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
            <span className="text-slate-300 font-mono">M 5.2 - 5.9 &bull; Moderate</span>
          </div>
        </div>

        {/* Selected Earthquake Detail Card */}
        {selectedEvent && (
          <div className="absolute top-4 right-4 z-[400] w-80 bg-[#0f172a]/95 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-sky-400">USGS EVENT DETAIL</span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg font-mono font-extrabold text-xl flex items-center justify-center text-white ${
                selectedEvent.magnitude >= 8.0 ? 'bg-fuchsia-600' :
                selectedEvent.magnitude >= 7.0 ? 'bg-rose-600' :
                selectedEvent.magnitude >= 6.0 ? 'bg-orange-600' : 'bg-amber-600'
              }`}>
                M{selectedEvent.magnitude.toFixed(1)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">{selectedEvent.place}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{selectedEvent.region_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Focal Depth</span>
                <span className="font-semibold text-slate-200">{selectedEvent.depth_km} km</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Date Recorded</span>
                <span className="font-semibold text-slate-200">{selectedEvent.date_str}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Coordinates</span>
                <span className="font-semibold text-slate-200">
                  {selectedEvent.location.coordinates[1].toFixed(2)}&deg;, {selectedEvent.location.coordinates[0].toFixed(2)}&deg;
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tsunami Alert</span>
                <span className={`font-semibold ${selectedEvent.tsunami === 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {selectedEvent.tsunami === 1 ? 'WARNING ISSUED' : 'No Tsunami'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Event ID: <code className="text-slate-300 font-mono">{selectedEvent.event_id}</code></span>
              <a
                href={`https://earthquake.usgs.gov/earthquakes/eventpage/${selectedEvent.event_id}`}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline"
              >
                View on USGS &rarr;
              </a>
            </div>
          </div>
        )}

        {/* Nearby Earthquakes Query Results Panel */}
        {geoNearMode && nearbyQuakes.length > 0 && (
          <div className="absolute bottom-4 right-4 z-[400] w-84 max-h-64 overflow-y-auto bg-[#0f172a]/95 backdrop-blur border border-emerald-800 rounded-xl p-3 shadow-2xl space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <Radio className="w-3.5 h-3.5" />
                <span>$geoNear Results ({nearbyQuakes.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">&le; {searchRadiusKm} km</span>
            </div>
            {nearbyQuakes.slice(0, 10).map((nq) => (
              <div key={nq.event_id} className="text-xs p-2 rounded bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-400 font-mono">M{nq.magnitude.toFixed(1)}</span>
                  <span className="text-slate-300 ml-1.5 truncate inline-block max-w-[140px]">{nq.place}</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">{nq.distance_km} km</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
