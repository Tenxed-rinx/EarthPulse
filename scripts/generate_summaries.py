"""
EarthPulse MongoDB Aggregation Pipelines & Analytical Summary Generator
Executes native MongoDB aggregation pipelines utilizing:
  $match, $group, $project, $sort, $lookup, $bucket, $addFields, $count, $geoNear
Populates derived analytical collections:
  - monthly_summary
  - daily_summary
  - magnitude_analysis
  - hotspot_cells
"""
import os
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database.mongo import get_db

def build_monthly_summary(db):
    print("\n1. Running Pipeline: Monthly Regional Summaries ($match, $group, $lookup, $project, $sort)...")
    pipeline = [
        {
            "$match": {
                "magnitude": {"$gte": 0.0}
            }
        },
        {
            "$group": {
                "_id": {
                    "year": "$year",
                    "month": "$month",
                    "region_id": "$region_id"
                },
                "event_count": {"$sum": 1},
                "avg_magnitude": {"$avg": "$magnitude"},
                "max_magnitude": {"$max": "$magnitude"},
                "avg_depth_km": {"$avg": "$depth_km"},
                "max_depth_km": {"$max": "$depth_km"},
                "tsunami_events": {"$sum": "$tsunami"}
            }
        },
        {
            "$lookup": {
                "from": "regions",
                "localField": "_id.region_id",
                "foreignField": "region_id",
                "as": "region_info"
            }
        },
        {
            "$addFields": {
                "region_name": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$region_info.region_name", 0]},
                        "$_id.region_id"
                    ]
                }
            }
        },
        {
            "$project": {
                "_id": {
                    "$concat": [
                        {"$toString": "$_id.year"},
                        "_",
                        {"$toString": "$_id.month"},
                        "_",
                        "$_id.region_id"
                    ]
                },
                "year": "$_id.year",
                "month": "$_id.month",
                "region_id": "$_id.region_id",
                "region_name": "$region_name",
                "event_count": "$event_count",
                "avg_magnitude": {"$round": ["$avg_magnitude", 2]},
                "max_magnitude": {"$round": ["$max_magnitude", 2]},
                "avg_depth_km": {"$round": ["$avg_depth_km", 2]},
                "max_depth_km": {"$round": ["$max_depth_km", 2]},
                "tsunami_events": "$tsunami_events",
                "updated_at": datetime.utcnow().isoformat() + "Z"
            }
        },
        {"$sort": {"year": -1, "month": -1, "event_count": -1}}
    ]

    results = list(db["earthquakes"].aggregate(pipeline))
    if results:
        db["monthly_summary"].delete_many({})
        db["monthly_summary"].insert_many(results)
    print(f"  [OK] Generated {len(results)} monthly regional summary documents.")
    return len(results)

def build_daily_summary(db):
    print("\n2. Running Pipeline: Daily Summaries ($group, $project, $sort)...")
    pipeline = [
        {
            "$group": {
                "_id": {
                    "date_str": "$date_str",
                    "region_id": "$region_id"
                },
                "earthquake_count": {"$sum": 1},
                "avg_magnitude": {"$avg": "$magnitude"},
                "max_magnitude": {"$max": "$magnitude"},
                "avg_depth_km": {"$avg": "$depth_km"},
                "tsunami_count": {"$sum": "$tsunami"}
            }
        },
        {
            "$project": {
                "_id": {
                    "$concat": ["$_id.date_str", "_", "$_id.region_id"]
                },
                "date_str": "$_id.date_str",
                "region_id": "$_id.region_id",
                "earthquake_count": "$earthquake_count",
                "avg_magnitude": {"$round": ["$avg_magnitude", 2]},
                "max_magnitude": {"$round": ["$max_magnitude", 2]},
                "avg_depth_km": {"$round": ["$avg_depth_km", 2]},
                "tsunami_count": "$tsunami_count",
                "updated_at": datetime.utcnow().isoformat() + "Z"
            }
        },
        {"$sort": {"date_str": -1}}
    ]

    results = list(db["earthquakes"].aggregate(pipeline))
    if results:
        db["daily_summary"].delete_many({})
        db["daily_summary"].insert_many(results)
    print(f"  [OK] Generated {len(results)} daily summary documents.")
    return len(results)

def build_magnitude_analysis(db):
    print("\n3. Running Pipeline: Magnitude Distribution using $bucket...")
    pipeline = [
        {
            "$bucket": {
                "groupBy": "$magnitude",
                "boundaries": [0.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0],
                "default": "Other",
                "output": {
                    "count": {"$sum": 1},
                    "avg_depth": {"$avg": "$depth_km"},
                    "max_magnitude": {"$max": "$magnitude"},
                    "min_magnitude": {"$min": "$magnitude"},
                    "tsunami_count": {"$sum": "$tsunami"}
                }
            }
        },
        {
            "$addFields": {
                "magnitude_category": {
                    "$switch": {
                        "branches": [
                            {"case": {"$eq": ["$_id", 0.0]}, "then": "Minor (< 4.0)"},
                            {"case": {"$eq": ["$_id", 4.0]}, "then": "Light (4.0 - 4.9)"},
                            {"case": {"$eq": ["$_id", 5.0]}, "then": "Moderate (5.0 - 5.9)"},
                            {"case": {"$eq": ["$_id", 6.0]}, "then": "Strong (6.0 - 6.9)"},
                            {"case": {"$eq": ["$_id", 7.0]}, "then": "Major (7.0 - 7.9)"},
                            {"case": {"$eq": ["$_id", 8.0]}, "then": "Great (8.0+)"}
                        ],
                        "default": "Unknown"
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 1,
                "magnitude_band": "$magnitude_category",
                "lower_bound": "$_id",
                "count": "$count",
                "avg_depth_km": {"$round": ["$avg_depth", 2]},
                "max_magnitude": "$max_magnitude",
                "min_magnitude": "$min_magnitude",
                "tsunami_count": "$tsunami_count"
            }
        },
        {"$sort": {"lower_bound": 1}}
    ]

    results = list(db["earthquakes"].aggregate(pipeline))
    if results:
        db["magnitude_analysis"].delete_many({})
        db["magnitude_analysis"].insert_many(results)
    print(f"  [OK] Generated {len(results)} magnitude distribution bands via $bucket.")
    return len(results)

def build_hotspot_cells(db):
    print("\n4. Running Pipeline: Geographical Hotspots (Spatial Grid Aggregation)...")
    pipeline = [
        {
            "$group": {
                "_id": "$grid_cell_id",
                "earthquake_count": {"$sum": 1},
                "avg_magnitude": {"$avg": "$magnitude"},
                "max_magnitude": {"$max": "$magnitude"},
                "avg_depth_km": {"$avg": "$depth_km"},
                "min_depth_km": {"$min": "$depth_km"},
                "max_depth_km": {"$max": "$depth_km"},
                "centroid": {"$first": "$grid_centroid"},
                "bounds": {"$first": "$grid_bounds"},
                "primary_region": {"$first": "$region_name"}
            }
        },
        {
            "$match": {
                "earthquake_count": {"$gte": 5}  # Focus on statistically significant hotspots
            }
        },
        {
            "$project": {
                "_id": "$_id",
                "grid_id": "$_id",
                "earthquake_count": "$earthquake_count",
                "avg_magnitude": {"$round": ["$avg_magnitude", 2]},
                "max_magnitude": {"$round": ["$max_magnitude", 2]},
                "avg_depth_km": {"$round": ["$avg_depth_km", 2]},
                "min_depth_km": {"$round": ["$min_depth_km", 2]},
                "max_depth_km": {"$round": ["$max_depth_km", 2]},
                "centroid": "$centroid",
                "bounds": "$bounds",
                "primary_region": "$primary_region",
                "seismic_density_tier": {
                    "$cond": {
                        "if": {"$gte": ["$earthquake_count", 100]},
                        "then": "Ultra High",
                        "else": {
                            "$cond": {
                                "if": {"$gte": ["$earthquake_count", 40]},
                                "then": "High",
                                "else": "Moderate"
                            }
                        }
                    }
                }
            }
        },
        {"$sort": {"earthquake_count": -1}}
    ]

    results = list(db["earthquakes"].aggregate(pipeline))
    if results:
        db["hotspot_cells"].delete_many({})
        db["hotspot_cells"].insert_many(results)
    print(f"  [OK] Generated {len(results)} high-density geographic hotspot grid cells.")
    return len(results)

def verify_all_aggregations():
    print("=" * 70)
    print("EARTHPULSE ETL - PHASE 4: DERIVED ANALYTICAL COLLECTIONS")
    print("=" * 70)

    db = get_db()
    c_monthly = build_monthly_summary(db)
    c_daily = build_daily_summary(db)
    c_mag = build_magnitude_analysis(db)
    c_hotspots = build_hotspot_cells(db)

    print("\n" + "=" * 70)
    print("ANALYTICAL SUMMARIES COMPLETE")
    print(f"  * monthly_summary:  {c_monthly} documents")
    print(f"  * daily_summary:    {c_daily} documents")
    print(f"  * magnitude_bands:  {c_mag} documents")
    print(f"  * hotspot_cells:    {c_hotspots} documents")
    print("=" * 70)

if __name__ == "__main__":
    verify_all_aggregations()
