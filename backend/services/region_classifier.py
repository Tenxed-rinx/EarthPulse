"""
EarthPulse Region Classifier & Seismological Categorization Service
Defines standardized geographic/tectonic regions, magnitude bands, and depth bands.
"""
import math

REGIONS_METADATA = [
    {
        "region_id": "REG_PACIFIC_EASIA",
        "region_name": "Pacific Ring of Fire - East Asia & Japan",
        "tectonic_setting": "Subduction zone (Pacific, Philippine, Eurasian plates)",
        "hazard_level": "Extremely High",
        "lat_min": 15.0, "lat_max": 55.0,
        "lon_min": 120.0, "lon_max": 155.0,
        "description": "Encompasses Japan Trench, Kuril-Kamchatka Trench, Ryukyu and Izu-Bonin arcs."
    },
    {
        "region_id": "REG_PACIFIC_SEASIA",
        "region_name": "Pacific Ring of Fire - Southeast Asia & Sunda Trench",
        "tectonic_setting": "Sunda Megathrust & complex microplate collision",
        "hazard_level": "Extremely High",
        "lat_min": -15.0, "lat_max": 15.0,
        "lon_min": 92.0, "lon_max": 145.0,
        "description": "Sumatra, Java, Banda Sea, and southern Philippine subduction zones."
    },
    {
        "region_id": "REG_PACIFIC_OCEANIA",
        "region_name": "Pacific Ring of Fire - Oceania & South Pacific",
        "tectonic_setting": "Tonga-Kermadec & Alpine Fault subduction",
        "hazard_level": "Extremely High",
        "lat_min": -55.0, "lat_max": -10.0,
        "lon_min": 145.0, "lon_max": 180.0,
        "description": "New Zealand, Tonga-Kermadec Trench, Fiji deep seismic zone, Vanuatu and Solomon arcs."
    },
    {
        "region_id": "REG_PACIFIC_NAMERICA",
        "region_name": "Pacific Ring of Fire - North America & Alaska",
        "tectonic_setting": "Aleutian megathrust, San Andreas transform & Cascadia subduction",
        "hazard_level": "High",
        "lat_min": 28.0, "lat_max": 72.0,
        "lon_min": -175.0, "lon_max": -115.0,
        "description": "Aleutian trench, Alaska range, Cascadia subduction, and Western USA fault systems."
    },
    {
        "region_id": "REG_PACIFIC_CAMERICA",
        "region_name": "Pacific Ring of Fire - Central America & Caribbean",
        "tectonic_setting": "Middle America Trench & Caribbean plate boundary",
        "hazard_level": "High",
        "lat_min": 5.0, "lat_max": 28.0,
        "lon_min": -115.0, "lon_max": -60.0,
        "description": "Cocos subduction under Caribbean plate, Mexico subduction, and Puerto Rico trench."
    },
    {
        "region_id": "REG_PACIFIC_SAMERICA",
        "region_name": "Pacific Ring of Fire - South America & Andes",
        "tectonic_setting": "Nazca plate subduction beneath South American plate",
        "hazard_level": "Extremely High",
        "lat_min": -56.0, "lat_max": 5.0,
        "lon_min": -85.0, "lon_max": -55.0,
        "description": "Peru-Chile trench and Andean volcanic arc (source of largest historical quakes)."
    },
    {
        "region_id": "REG_HIMALAYA_SASIA",
        "region_name": "Himalayan & South Asian Collision Belt",
        "tectonic_setting": "Continental collision (Indian plate into Eurasian plate)",
        "hazard_level": "Very High",
        "lat_min": 20.0, "lat_max": 45.0,
        "lon_min": 65.0, "lon_max": 105.0,
        "description": "Main Himalayan Thrust, Tibetan Plateau, Pamir-Hindu Kush, and Zagros-Makran belts."
    },
    {
        "region_id": "REG_MEDITERRANEAN",
        "region_name": "Mediterranean & Alpine-Middle East Belt",
        "tectonic_setting": "African and Arabian plates convergence with Eurasia",
        "hazard_level": "Very High",
        "lat_min": 25.0, "lat_max": 48.0,
        "lon_min": -15.0, "lon_max": 65.0,
        "description": "Hellenic arc, North Anatolian Fault, Italian Apennines, and Caucasus range."
    },
    {
        "region_id": "REG_MID_ATLANTIC",
        "region_name": "Mid-Atlantic Ridge & Polar Oceans",
        "tectonic_setting": "Divergent seafloor spreading plate boundaries",
        "hazard_level": "Moderate",
        "lat_min": -60.0, "lat_max": 80.0,
        "lon_min": -45.0, "lon_max": -15.0,
        "description": "Mid-Atlantic Ridge spreading center, Iceland hotspot, and polar ocean rifts."
    },
    {
        "region_id": "REG_GLOBAL_OTHER",
        "region_name": "Global Intraplate & Oceanic Basins",
        "tectonic_setting": "Stable continental cratons and intraplate deformation",
        "hazard_level": "Low to Moderate",
        "lat_min": -90.0, "lat_max": 90.0,
        "lon_min": -180.0, "lon_max": 180.0,
        "description": "Intraplate earthquakes, Australian shield, African rift, and stable continental interiors."
    }
]

def classify_region(lat: float, lon: float):
    """
    Classifies a latitude and longitude into an analytical tectonic/geographic region.
    Tonga/Fiji longitude wraparound is accounted for (-180 to -165 in Southern Hemisphere).
    """
    # Special case: Tonga / Kermadec trench crosses antimeridian (-180 to -165, Lat -55 to -10)
    if -55.0 <= lat <= -10.0 and -180.0 <= lon <= -165.0:
        return "REG_PACIFIC_OCEANIA", "Pacific Ring of Fire - Oceania & South Pacific"

    for r in REGIONS_METADATA:
        if r["region_id"] == "REG_GLOBAL_OTHER":
            continue
        if r["lat_min"] <= lat <= r["lat_max"] and r["lon_min"] <= lon <= r["lon_max"]:
            return r["region_id"], r["region_name"]
            
    return "REG_GLOBAL_OTHER", "Global Intraplate & Oceanic Basins"

def get_magnitude_band(magnitude: float) -> str:
    """Classifies earthquake magnitude into standard seismological bands."""
    if magnitude < 4.0:
        return "Minor (< 4.0)"
    elif magnitude < 5.0:
        return "Light (4.0 - 4.9)"
    elif magnitude < 6.0:
        return "Moderate (5.0 - 5.9)"
    elif magnitude < 7.0:
        return "Strong (6.0 - 6.9)"
    elif magnitude < 8.0:
        return "Major (7.0 - 7.9)"
    else:
        return "Great (8.0+)"

def get_depth_band(depth_km: float) -> str:
    """Classifies focal depth into standard seismological depth regimes."""
    if depth_km <= 70.0:
        return "Shallow (0 - 70 km)"
    elif depth_km <= 300.0:
        return "Intermediate (70 - 300 km)"
    else:
        return "Deep (300+ km)"

def get_grid_cell(lat: float, lon: float, cell_size_deg: float = 2.0):
    """Calculates 2-degree geographic grid cell ID and bounding box."""
    lat_idx = int(math.floor(lat / cell_size_deg) * cell_size_deg)
    lon_idx = int(math.floor(lon / cell_size_deg) * cell_size_deg)
    grid_id = f"grid_{lat_idx:+03d}_{lon_idx:+04d}"
    centroid_lat = lat_idx + cell_size_deg / 2.0
    centroid_lon = lon_idx + cell_size_deg / 2.0
    return {
        "grid_id": grid_id,
        "centroid": [centroid_lon, centroid_lat],
        "bounds": [lat_idx, lon_idx, lat_idx + cell_size_deg, lon_idx + cell_size_deg]
    }
