"""
EarthPulse Power BI Data Exporter & Model Architect
Extracts native MongoDB collections and aggregations into relational star-schema CSV tables:
  - fact_earthquakes.csv
  - dim_date.csv
  - dim_region.csv
  - dim_magnitude_band.csv
  - dim_depth_band.csv
  - agg_monthly_seismic.csv
  - agg_hotspot_cells.csv
Generates DAX measure specifications and Power BI data reconciliation metrics.
"""
import os
import sys
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database.mongo import get_db
from backend.services.region_classifier import REGIONS_METADATA

EXPORTS_DIR = os.path.join(BASE_DIR, "powerbi", "exports")

def export_powerbi_data():
    print("=" * 70)
    print("EARTHPULSE ETL - PHASE 5: POWER BI STAR-SCHEMA DATA EXPORT")
    print(f"Target Directory: {EXPORTS_DIR}")
    print("=" * 70)

    os.makedirs(EXPORTS_DIR, exist_ok=True)
    db = get_db()

    # 1. Export dim_region.csv
    print("\n1. Exporting dim_region.csv...")
    df_regions = pd.DataFrame(REGIONS_METADATA)
    regions_csv = os.path.join(EXPORTS_DIR, "dim_region.csv")
    df_regions.to_csv(regions_csv, index=False)
    print(f"  [OK] Exported {len(df_regions)} regions.")

    # 2. Export dim_magnitude_band.csv
    print("\n2. Exporting dim_magnitude_band.csv...")
    mag_bands_data = [
        {"magnitude_band": "Minor (< 4.0)", "lower_bound": 0.0, "upper_bound": 3.99, "severity_order": 1, "description": "Often felt, rarely causes damage"},
        {"magnitude_band": "Light (4.0 - 4.9)", "lower_bound": 4.0, "upper_bound": 4.99, "severity_order": 2, "description": "Noticeable shaking, minor damage possible"},
        {"magnitude_band": "Moderate (5.0 - 5.9)", "lower_bound": 5.0, "upper_bound": 5.99, "severity_order": 3, "description": "Damage to poorly constructed buildings"},
        {"magnitude_band": "Strong (6.0 - 6.9)", "lower_bound": 6.0, "upper_bound": 6.99, "severity_order": 4, "description": "Destructive in areas up to 160 km across"},
        {"magnitude_band": "Major (7.0 - 7.9)", "lower_bound": 7.0, "upper_bound": 7.99, "severity_order": 5, "description": "Severe damage over large regions"},
        {"magnitude_band": "Great (8.0+)", "lower_bound": 8.0, "upper_bound": 10.0, "severity_order": 6, "description": "Devastating damage across hundreds of km"}
    ]
    df_mag_bands = pd.DataFrame(mag_bands_data)
    df_mag_bands.to_csv(os.path.join(EXPORTS_DIR, "dim_magnitude_band.csv"), index=False)
    print(f"  [OK] Exported {len(df_mag_bands)} magnitude bands.")

    # 3. Export dim_depth_band.csv
    print("\n3. Exporting dim_depth_band.csv...")
    depth_bands_data = [
        {"depth_band": "Shallow (0 - 70 km)", "min_depth_km": 0.0, "max_depth_km": 70.0, "tectonic_context": "Crustal & subduction interface, maximum surface energy transfer"},
        {"depth_band": "Intermediate (70 - 300 km)", "min_depth_km": 70.0, "max_depth_km": 300.0, "tectonic_context": "Subducting slab dehydration embrittlement"},
        {"depth_band": "Deep (300+ km)", "min_depth_km": 300.0, "max_depth_km": 1000.0, "tectonic_context": "Phase transformations in deep mantle slabs (Wadati-Benioff)"}
    ]
    df_depth_bands = pd.DataFrame(depth_bands_data)
    df_depth_bands.to_csv(os.path.join(EXPORTS_DIR, "dim_depth_band.csv"), index=False)
    print(f"  [OK] Exported {len(df_depth_bands)} depth bands.")

    # 4. Export fact_earthquakes.csv & dim_date.csv
    print("\n4. Exporting fact_earthquakes.csv from MongoDB...")
    cursor = db["earthquakes"].find(
        {},
        {
            "_id": 0,
            "event_id": 1,
            "date_str": 1,
            "timestamp_ms": 1,
            "year": 1,
            "month": 1,
            "day": 1,
            "hour": 1,
            "day_of_week": 1,
            "magnitude": 1,
            "mag_type": 1,
            "depth_km": 1,
            "region_id": 1,
            "region_name": 1,
            "magnitude_band": 1,
            "depth_band": 1,
            "grid_cell_id": 1,
            "location.coordinates": 1,
            "place": 1,
            "tsunami": 1,
            "significance": 1,
            "status": 1
        }
    )
    raw_quakes = list(cursor)
    flat_quakes = []
    unique_dates = set()

    for q in raw_quakes:
        coords = q.get("location", {}).get("coordinates", [0.0, 0.0])
        lon = coords[0] if len(coords) >= 1 else 0.0
        lat = coords[1] if len(coords) >= 2 else 0.0
        dt_str = q.get("date_str")
        if dt_str:
            unique_dates.add(dt_str)

        flat_quakes.append({
            "event_id": q.get("event_id"),
            "date_str": dt_str,
            "timestamp_ms": q.get("timestamp_ms"),
            "year": q.get("year"),
            "month": q.get("month"),
            "day": q.get("day"),
            "hour": q.get("hour"),
            "day_of_week": q.get("day_of_week"),
            "magnitude": q.get("magnitude"),
            "mag_type": q.get("mag_type"),
            "depth_km": q.get("depth_km"),
            "region_id": q.get("region_id"),
            "magnitude_band": q.get("magnitude_band"),
            "depth_band": q.get("depth_band"),
            "grid_cell_id": q.get("grid_cell_id"),
            "longitude": lon,
            "latitude": lat,
            "place": q.get("place"),
            "tsunami": q.get("tsunami"),
            "significance": q.get("significance"),
            "status": q.get("status")
        })

    df_quakes = pd.DataFrame(flat_quakes)
    quakes_csv = os.path.join(EXPORTS_DIR, "fact_earthquakes.csv")
    df_quakes.to_csv(quakes_csv, index=False)
    print(f"  [OK] Exported {len(df_quakes)} rows to {quakes_csv}.")

    # Generate dim_date.csv
    print("\n5. Generating dim_date.csv...")
    date_rows = []
    for d_str in sorted(list(unique_dates)):
        try:
            d_obj = datetime.strptime(d_str, "%Y-%m-%d")
            quarter = (d_obj.month - 1) // 3 + 1
            date_rows.append({
                "date_str": d_str,
                "date": d_str,
                "year": d_obj.year,
                "month": d_obj.month,
                "month_name": d_obj.strftime("%B"),
                "day": d_obj.day,
                "day_of_week": d_obj.strftime("%A"),
                "quarter": f"Q{quarter}",
                "year_month": d_obj.strftime("%Y-%m"),
                "is_weekend": 1 if d_obj.weekday() >= 5 else 0
            })
        except Exception:
            pass

    df_dates = pd.DataFrame(date_rows)
    dates_csv = os.path.join(EXPORTS_DIR, "dim_date.csv")
    df_dates.to_csv(dates_csv, index=False)
    print(f"  [OK] Exported {len(df_dates)} distinct calendar days to {dates_csv}.")

    # 6. Export agg_monthly_seismic.csv
    print("\n6. Exporting agg_monthly_seismic.csv...")
    monthly_data = list(db["monthly_summary"].find({}, {"_id": 0}))
    df_monthly = pd.DataFrame(monthly_data)
    monthly_csv = os.path.join(EXPORTS_DIR, "agg_monthly_seismic.csv")
    df_monthly.to_csv(monthly_csv, index=False)
    print(f"  [OK] Exported {len(df_monthly)} monthly aggregations.")

    # 7. Export agg_hotspot_cells.csv
    print("\n7. Exporting agg_hotspot_cells.csv...")
    hotspot_data = list(db["hotspot_cells"].find({}, {"_id": 0}))
    flat_hotspots = []
    for h in hotspot_data:
        centroid = h.get("centroid", [0.0, 0.0])
        flat_hotspots.append({
            "grid_id": h.get("grid_id"),
            "earthquake_count": h.get("earthquake_count"),
            "avg_magnitude": h.get("avg_magnitude"),
            "max_magnitude": h.get("max_magnitude"),
            "avg_depth_km": h.get("avg_depth_km"),
            "min_depth_km": h.get("min_depth_km"),
            "max_depth_km": h.get("max_depth_km"),
            "centroid_lon": centroid[0] if len(centroid) >= 1 else 0.0,
            "centroid_lat": centroid[1] if len(centroid) >= 2 else 0.0,
            "primary_region": h.get("primary_region"),
            "seismic_density_tier": h.get("seismic_density_tier")
        })
    df_hotspots = pd.DataFrame(flat_hotspots)
    hotspots_csv = os.path.join(EXPORTS_DIR, "agg_hotspot_cells.csv")
    df_hotspots.to_csv(hotspots_csv, index=False)
    print(f"  [OK] Exported {len(df_hotspots)} hotspot cells.")

    # Generate Data Reconciliation Summary
    reconciliation = {
        "export_timestamp": datetime.utcnow().isoformat() + "Z",
        "mongodb_collection_count": db["earthquakes"].count_documents({}),
        "powerbi_fact_rows": len(df_quakes),
        "powerbi_date_rows": len(df_dates),
        "powerbi_region_rows": len(df_regions),
        "powerbi_monthly_agg_rows": len(df_monthly),
        "powerbi_hotspot_rows": len(df_hotspots),
        "avg_magnitude_mongo": round(df_quakes["magnitude"].mean(), 2),
        "max_magnitude_mongo": round(df_quakes["magnitude"].max(), 2),
        "min_magnitude_mongo": round(df_quakes["magnitude"].min(), 2),
        "avg_depth_km_mongo": round(df_quakes["depth_km"].mean(), 2),
        "total_tsunami_flags": int(df_quakes["tsunami"].sum()),
        "integrity_verified": len(df_quakes) == db["earthquakes"].count_documents({})
    }
    recon_path = os.path.join(EXPORTS_DIR, "reconciliation_audit.json")
    import json
    with open(recon_path, "w", encoding="utf-8") as f:
        json.dump(reconciliation, f, indent=2)
    print(f"\nSaved reconciliation audit report to: {recon_path}")

    print("\n" + "=" * 70)
    print("POWER BI RECONCILIATION SUMMARY")
    print(f"MongoDB 'earthquakes' count: {reconciliation['mongodb_collection_count']}")
    print(f"Power BI Fact Table rows:   {reconciliation['powerbi_fact_rows']}")
    print(f"Average Magnitude:          {reconciliation['avg_magnitude_mongo']}")
    print(f"Maximum Magnitude:          {reconciliation['max_magnitude_mongo']}")
    print(f"Integrity Reconciled:       {reconciliation['integrity_verified']}")
    print("=" * 70)

if __name__ == "__main__":
    export_powerbi_data()
