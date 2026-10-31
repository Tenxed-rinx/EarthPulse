"""
EarthPulse Data Ingestion Script - USGS Catalog Downloader
Extracts historical earthquake data from USGS FDSNWS Event API (2000 - 2025).
Handles pagination, date intervals, exponential backoff retries, and records extraction metadata.
"""
import os
import sys
import json
import time
import requests
from datetime import datetime

# Adjust sys.path so we can import backend packages if needed
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "usgs_earthquakes_raw.json")
METADATA_PATH = os.path.join(BASE_DIR, "data", "raw", "extraction_metadata.json")

USGS_QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

def download_chunk(start_date: str, end_date: str, min_mag: float = 5.2, max_retries: int = 4):
    params = {
        "format": "geojson",
        "starttime": start_date,
        "endtime": end_date,
        "minmagnitude": min_mag,
        "orderby": "time-asc"
    }
    for attempt in range(1, max_retries + 1):
        try:
            print(f"  Fetching [{start_date} -> {end_date}] (M>={min_mag}) - Attempt {attempt}...")
            resp = requests.get(USGS_QUERY_URL, params=params, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                print(f"  Success: Received {len(features)} records.")
                return features
            elif resp.status_code == 429:
                wait_time = attempt * 5
                print(f"  Rate limited (429). Sleeping {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"  USGS returned HTTP {resp.status_code}: {resp.text[:150]}")
                time.sleep(attempt * 2)
        except Exception as e:
            print(f"  Error on attempt {attempt}: {e}")
            time.sleep(attempt * 2)
    print(f"  FAILED chunk {start_date} to {end_date} after {max_retries} retries.")
    return []

def run_download(start_year: int = 2000, end_year: int = 2025, min_mag: float = 5.2):
    print("=" * 70)
    print("EARTHPULSE ETL - PHASE 1: USGS DATA EXTRACTION")
    print(f"Target Period: {start_year}-01-01 to {end_year}-01-01 | Min Magnitude: {min_mag}")
    print("=" * 70)

    start_time = datetime.utcnow()
    all_features = {}
    total_downloaded = 0
    intervals = []

    # 2-year chunks
    for y in range(start_year, end_year, 2):
        chunk_start = f"{y}-01-01"
        chunk_end = f"{min(y+2, end_year)}-01-01"
        intervals.append((chunk_start, chunk_end))

    for idx, (c_start, c_end) in enumerate(intervals, 1):
        print(f"\nChunk {idx}/{len(intervals)}:")
        chunk_features = download_chunk(c_start, c_end, min_mag=min_mag)
        total_downloaded += len(chunk_features)
        for f in chunk_features:
            f_id = f.get("id")
            if f_id:
                all_features[f_id] = f
        time.sleep(0.5)  # Politeness delay

    distinct_count = len(all_features)
    end_time = datetime.utcnow()
    duration_sec = (end_time - start_time).total_seconds()

    print("\n" + "=" * 70)
    print("EXTRACTION SUMMARY")
    print(f"Total downloaded event records: {total_downloaded}")
    print(f"Distinct events after deduplication: {distinct_count}")
    print(f"Elapsed time: {duration_sec:.1f} seconds")
    print("=" * 70)

    # Save raw records
    os.makedirs(os.path.dirname(RAW_DATA_PATH), exist_ok=True)
    raw_list = list(all_features.values())
    with open(RAW_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(raw_list, f, ensure_ascii=False)
    print(f"Saved {len(raw_list)} raw features to: {RAW_DATA_PATH}")

    # Save extraction metadata
    meta = {
        "source": "USGS Comprehensive Earthquake Catalog (ComCat)",
        "source_url": "https://earthquake.usgs.gov/fdsnws/event/1/",
        "query_start": f"{start_year}-01-01",
        "query_end": f"{end_year}-01-01",
        "min_magnitude": min_mag,
        "extraction_started_at": start_time.isoformat() + "Z",
        "extraction_completed_at": end_time.isoformat() + "Z",
        "duration_seconds": duration_sec,
        "total_records_downloaded": total_downloaded,
        "distinct_records": distinct_count,
        "raw_file_bytes": os.path.getsize(RAW_DATA_PATH)
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"Saved extraction metadata to: {METADATA_PATH}")

    return RAW_DATA_PATH, meta

if __name__ == "__main__":
    run_download()
