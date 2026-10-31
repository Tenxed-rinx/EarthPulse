"""
EarthPulse Database Indexing Script
Configures and verifies optimized indexes in MongoDB 'earthpulse_db' collections.
Demonstrates:
  1. Unique index on event ID (_id / event_id) - prevents duplicate event ingestion
  2. Index on event timestamp (timestamp_ms, event_time) - optimizes temporal filtering
  3. Compound index on magnitude and timestamp (magnitude, timestamp_ms) - accelerates threshold range queries
  4. Compound index on region and timestamp (region_id, timestamp_ms) - accelerates regional historical analysis
  5. Geospatial 2dsphere index on location - enables $geoNear, $nearSphere and geo-spatial aggregation
  6. Single field index on depth (depth_km) - accelerates depth-stratified seismic filtering
"""
import os
import sys
from pymongo import ASCENDING, DESCENDING, GEOSPHERE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database.mongo import get_db

def create_indexes():
    print("=" * 70)
    print("EARTHPULSE DATABASE ARCHITECTURE: MONGODB INDEX INITIALIZATION")
    print("=" * 70)

    db = get_db()
    col = db["earthquakes"]

    print("\n1. Building indexes on 'earthquakes' collection...")

    # Unique index on event_id
    idx_event_id = col.create_index([("event_id", ASCENDING)], unique=True, name="idx_unique_event_id")
    print(f"  [OK] Unique index created: {idx_event_id} (Ensures USGS event idempotency)")

    # Timestamp index
    idx_time = col.create_index([("timestamp_ms", DESCENDING)], name="idx_timestamp_desc")
    print(f"  [OK] Timestamp index created: {idx_time} (Optimizes time-series queries)")

    # Compound index on magnitude + timestamp
    idx_mag_time = col.create_index([("magnitude", DESCENDING), ("timestamp_ms", DESCENDING)], name="idx_comp_mag_time")
    print(f"  [OK] Compound index created: {idx_mag_time} (Accelerates high-magnitude event queries)")

    # Compound index on region + timestamp
    idx_reg_time = col.create_index([("region_id", ASCENDING), ("timestamp_ms", DESCENDING)], name="idx_comp_region_time")
    print(f"  [OK] Compound index created: {idx_reg_time} (Accelerates regional timeline lookups)")

    # Geospatial 2dsphere index
    idx_geo = col.create_index([("location", GEOSPHERE)], name="idx_geospatial_2dsphere")
    print(f"  [OK] Geospatial 2dsphere index created: {idx_geo} (Enables $geoNear distance calculations)")

    # Depth index
    idx_depth = col.create_index([("depth_km", ASCENDING)], name="idx_depth_asc")
    print(f"  [OK] Depth index created: {idx_depth} (Optimizes subduction slab depth filtering)")

    # Grid cell index
    idx_grid = col.create_index([("grid_cell_id", ASCENDING)], name="idx_grid_cell")
    print(f"  [OK] Grid cell index created: {idx_grid} (Accelerates spatial cell aggregation)")

    print("\n2. Building indexes on analytical & metadata collections...")
    db["regions"].create_index([("region_id", ASCENDING)], unique=True, name="idx_unique_region_id")
    db["daily_summary"].create_index([("date_str", DESCENDING), ("region_id", ASCENDING)], unique=True, name="idx_daily_date_region")
    db["monthly_summary"].create_index([("year", DESCENDING), ("month", DESCENDING), ("region_id", ASCENDING)], unique=True, name="idx_monthly_yr_mo_reg")
    db["hotspot_cells"].create_index([("grid_id", ASCENDING)], unique=True, name="idx_hotspot_grid_id")
    db["users"].create_index([("username", ASCENDING)], unique=True, name="idx_unique_username")
    db["users"].create_index([("email", ASCENDING)], unique=True, name="idx_unique_email")
    db["ingestion_logs"].create_index([("import_id", ASCENDING)], unique=True, name="idx_ingest_id")
    print("  [OK] Summary and support collection indexes configured.")

    print("\n3. Verifying all indexes on 'earthquakes':")
    for name, info in col.index_information().items():
        print(f"  * Name: {name:<26} | Keys: {info['key']}")

    print("\n" + "=" * 70)
    print("MONGODB INDEX VERIFICATION COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    create_indexes()
