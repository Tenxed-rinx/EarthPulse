"""
EarthPulse Data Transformation & Quality Cleaning Script
Validates raw USGS GeoJSON features, normalizes schemas, standardizes fields,
computes seismological bands, assigns tectonic regions, and records quality metrics.
"""
import os
import sys
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.services.region_classifier import (
    classify_region,
    get_magnitude_band,
    get_depth_band,
    get_grid_cell
)

RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "usgs_earthquakes_raw.json")
CLEANED_DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "usgs_earthquakes_cleaned.json")
QUALITY_REPORT_PATH = os.path.join(BASE_DIR, "data", "processed", "data_quality_report.json")

def clean_and_transform():
    print("=" * 70)
    print("EARTHPULSE ETL - PHASE 2: DATA TRANSFORMATION & QUALITY CLEANING")
    print("=" * 70)

    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw data file not found at: {RAW_DATA_PATH}")

    with open(RAW_DATA_PATH, "r", encoding="utf-8") as f:
        raw_features = json.load(f)

    print(f"Loaded {len(raw_features)} raw features for validation.")

    cleaned_records = []
    seen_ids = set()

    # Quality counters
    stats = {
        "total_input_records": len(raw_features),
        "valid_clean_records": 0,
        "duplicate_id_rejected": 0,
        "invalid_geometry_rejected": 0,
        "invalid_coordinates_rejected": 0,
        "missing_or_invalid_mag_rejected": 0,
        "invalid_depth_rejected": 0,
        "invalid_timestamp_rejected": 0,
        "missing_place_imputed": 0,
        "missing_mag_type_imputed": 0,
        "tsunami_flags_count": 0,
        "magnitude_range": {"min": 99.0, "max": -1.0},
        "depth_range_km": {"min": 9999.0, "max": -99.0},
        "year_distribution": {}
    }

    for item in raw_features:
        event_id = item.get("id")
        if not event_id:
            stats["invalid_geometry_rejected"] += 1
            continue

        if event_id in seen_ids:
            stats["duplicate_id_rejected"] += 1
            continue

        geom = item.get("geometry") or {}
        coords = geom.get("coordinates")
        if not coords or len(coords) < 2:
            stats["invalid_geometry_rejected"] += 1
            continue

        lon, lat = coords[0], coords[1]
        depth = coords[2] if len(coords) >= 3 else 10.0

        # Coordinate bounds check
        if not (-180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0):
            stats["invalid_coordinates_rejected"] += 1
            continue

        props = item.get("properties") or {}
        mag = props.get("mag")
        if mag is None or not (0.0 <= mag <= 10.0):
            stats["missing_or_invalid_mag_rejected"] += 1
            continue

        if depth is None or depth < -5.0 or depth > 1000.0:
            stats["invalid_depth_rejected"] += 1
            continue

        time_ms = props.get("time")
        if not time_ms or not isinstance(time_ms, (int, float)):
            stats["invalid_timestamp_rejected"] += 1
            continue

        try:
            event_dt = datetime.utcfromtimestamp(time_ms / 1000.0)
        except Exception:
            stats["invalid_timestamp_rejected"] += 1
            continue

        seen_ids.add(event_id)

        # Impute minor textual attributes if missing
        place = props.get("place")
        if not place or not str(place).strip():
            place = f"Location at [{lat:.2f}, {lon:.2f}]"
            stats["missing_place_imputed"] += 1

        mag_type = props.get("magType")
        if not mag_type:
            mag_type = "mww"
            stats["missing_mag_type_imputed"] += 1

        tsunami = int(props.get("tsunami") or 0)
        if tsunami == 1:
            stats["tsunami_flags_count"] += 1

        # Classify region, grid, and bands
        region_id, region_name = classify_region(lat, lon)
        mag_band = get_magnitude_band(mag)
        depth_band = get_depth_band(depth)
        grid = get_grid_cell(lat, lon, cell_size_deg=2.0)

        # Update min/max ranges
        stats["magnitude_range"]["min"] = min(stats["magnitude_range"]["min"], mag)
        stats["magnitude_range"]["max"] = max(stats["magnitude_range"]["max"], mag)
        stats["depth_range_km"]["min"] = min(stats["depth_range_km"]["min"], depth)
        stats["depth_range_km"]["max"] = max(stats["depth_range_km"]["max"], depth)

        yr_str = str(event_dt.year)
        stats["year_distribution"][yr_str] = stats["year_distribution"].get(yr_str, 0) + 1

        # Construct MongoDB schema-ready document
        doc = {
            "_id": event_id,
            "event_id": event_id,
            "magnitude": round(float(mag), 2),
            "mag_type": str(mag_type).lower(),
            "place": str(place).strip(),
            "event_time": event_dt.isoformat() + "Z",
            "timestamp_ms": int(time_ms),
            "year": event_dt.year,
            "month": event_dt.month,
            "day": event_dt.day,
            "date_str": event_dt.strftime("%Y-%m-%d"),
            "hour": event_dt.hour,
            "day_of_week": event_dt.strftime("%A"),
            "depth_km": round(float(depth), 2),
            "status": props.get("status", "reviewed"),
            "event_type": props.get("type", "earthquake"),
            "tsunami": tsunami,
            "significance": int(props.get("sig") or 0),
            "region_id": region_id,
            "region_name": region_name,
            "magnitude_band": mag_band,
            "depth_band": depth_band,
            "grid_cell_id": grid["grid_id"],
            "grid_centroid": grid["centroid"],
            "grid_bounds": grid["bounds"],
            "location": {
                "type": "Point",
                "coordinates": [round(float(lon), 4), round(float(lat), 4)]
            },
            "source_metadata": {
                "source": "USGS",
                "url": props.get("url"),
                "net": props.get("net"),
                "code": props.get("code"),
                "nst": props.get("nst"),
                "dmin": props.get("dmin"),
                "rms": props.get("rms"),
                "gap": props.get("gap")
            },
            "imported_at": datetime.utcnow().isoformat() + "Z"
        }
        cleaned_records.append(doc)

    stats["valid_clean_records"] = len(cleaned_records)

    # Save cleaned JSON
    os.makedirs(os.path.dirname(CLEANED_DATA_PATH), exist_ok=True)
    with open(CLEANED_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(cleaned_records, f, ensure_ascii=False)
    print(f"Cleaned dataset written to: {CLEANED_DATA_PATH} ({len(cleaned_records)} records)")

    # Save data quality report
    with open(QUALITY_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print(f"Data quality report written to: {QUALITY_REPORT_PATH}")

    print("\n" + "=" * 70)
    print("DATA QUALITY AUDIT REPORT")
    print(f"Total raw features: {stats['total_input_records']}")
    print(f"Valid clean records: {stats['valid_clean_records']}")
    print(f"Duplicate IDs: {stats['duplicate_id_rejected']}")
    print(f"Invalid coordinates: {stats['invalid_coordinates_rejected']}")
    print(f"Invalid magnitude: {stats['missing_or_invalid_mag_rejected']}")
    print(f"Tsunami warnings: {stats['tsunami_flags_count']}")
    print(f"Magnitude span: M{stats['magnitude_range']['min']} - M{stats['magnitude_range']['max']}")
    print(f"Depth span: {stats['depth_range_km']['min']} km - {stats['depth_range_km']['max']} km")
    print(f"Years spanned: {len(stats['year_distribution'])} years")
    print("=" * 70)

    return CLEANED_DATA_PATH, stats

if __name__ == "__main__":
    clean_and_transform()
