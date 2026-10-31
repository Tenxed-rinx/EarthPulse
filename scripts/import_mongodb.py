"""
EarthPulse Database Ingestion Script
Loads validated earthquake records and region definitions into MongoDB 'earthpulse_db'.
Uses PyMongo BulkWrite with UpdateOne(upsert=True) to ensure idempotency.
Logs comprehensive ingestion telemetry in 'ingestion_logs'.
Seeds default authentication accounts.
"""
import os
import sys
import json
import uuid
from datetime import datetime
from pymongo import UpdateOne
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database.mongo import get_db
from backend.services.region_classifier import REGIONS_METADATA
from scripts.create_indexes import create_indexes

CLEANED_DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "usgs_earthquakes_cleaned.json")
QUALITY_REPORT_PATH = os.path.join(BASE_DIR, "data", "processed", "data_quality_report.json")

def seed_regions(db):
    print("Populating 'regions' collection...")
    regions_col = db["regions"]
    for reg in REGIONS_METADATA:
        regions_col.update_one(
            {"region_id": reg["region_id"]},
            {"$set": reg},
            upsert=True
        )
    print(f"  [OK] Successfully configured {len(REGIONS_METADATA)} analytical regions.")

def seed_users(db):
    print("Seeding default role-based user accounts...")
    users_col = db["users"]
    default_users = [
        {
            "username": "admin",
            "email": "admin@earthpulse.org",
            "password_hash": generate_password_hash("admin123"),
            "role": "admin",
            "full_name": "System Administrator",
            "created_at": datetime.utcnow().isoformat() + "Z"
        },
        {
            "username": "analyst",
            "email": "analyst@earthpulse.org",
            "password_hash": generate_password_hash("analyst123"),
            "role": "analyst",
            "full_name": "Lead Seismic Analyst",
            "created_at": datetime.utcnow().isoformat() + "Z"
        },
        {
            "username": "viewer",
            "email": "viewer@earthpulse.org",
            "password_hash": generate_password_hash("viewer123"),
            "role": "viewer",
            "full_name": "Public Viewer",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
    ]
    for u in default_users:
        users_col.update_one(
            {"username": u["username"]},
            {"$set": u},
            upsert=True
        )
    print("  [OK] Accounts created: admin, analyst, viewer.")

def import_to_mongodb():
    print("=" * 70)
    print("EARTHPULSE ETL - PHASE 3: MONGODB BULK LOADING")
    print("=" * 70)

    # 1. Initialize Indexes
    create_indexes()

    db = get_db()
    seed_regions(db)
    seed_users(db)

    # 2. Read Cleaned Dataset
    if not os.path.exists(CLEANED_DATA_PATH):
        raise FileNotFoundError(f"Cleaned dataset not found at: {CLEANED_DATA_PATH}")

    with open(CLEANED_DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    rejected_count = 0
    if os.path.exists(QUALITY_REPORT_PATH):
        with open(QUALITY_REPORT_PATH, "r", encoding="utf-8") as f:
            q_stats = json.load(f)
            rejected_count = (
                q_stats.get("duplicate_id_rejected", 0) +
                q_stats.get("invalid_coordinates_rejected", 0) +
                q_stats.get("missing_or_invalid_mag_rejected", 0) +
                q_stats.get("invalid_depth_rejected", 0)
            )

    print(f"\nBeginning bulk loading of {len(records)} verified earthquake documents...")
    import_id = f"INGEST_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:6]}"
    start_time = datetime.utcnow()

    earthquakes_col = db["earthquakes"]
    batch_size = 1000
    total_upserted = 0
    total_modified = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        operations = [
            UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
            for doc in batch
        ]
        result = earthquakes_col.bulk_write(operations, ordered=False)
        total_upserted += len(result.upserted_ids)
        total_modified += result.modified_count
        print(f"  Processed {min(i + batch_size, len(records))}/{len(records)} records...")

    end_time = datetime.utcnow()
    duration_sec = (end_time - start_time).total_seconds()
    actual_db_count = earthquakes_col.count_documents({})

    # 3. Record Ingestion Log
    log_entry = {
        "import_id": import_id,
        "source_url": "https://earthquake.usgs.gov/fdsnws/event/1/query",
        "started_at": start_time.isoformat() + "Z",
        "completed_at": end_time.isoformat() + "Z",
        "duration_seconds": round(duration_sec, 2),
        "total_processed": len(records),
        "inserted_records": total_upserted,
        "updated_records": total_modified,
        "rejected_records": rejected_count,
        "total_active_records_in_db": actual_db_count,
        "status": "COMPLETED"
    }

    db["ingestion_logs"].insert_one(log_entry)

    print("\n" + "=" * 70)
    print("MONGODB INGESTION SUMMARY")
    print(f"Import ID: {import_id}")
    print(f"Processed records: {len(records)}")
    print(f"New documents inserted: {total_upserted}")
    print(f"Existing documents updated: {total_modified}")
    print(f"Rejected records logged: {rejected_count}")
    print(f"Total documents in 'earthquakes' collection: {actual_db_count}")
    print(f"Execution time: {duration_sec:.2f} seconds")
    print("=" * 70)

    return import_id, actual_db_count

if __name__ == "__main__":
    import_to_mongodb()
