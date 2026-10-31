"""
EarthPulse Analytics & Aggregation API Routes
Provides analytical summaries, temporal trends, regional comparisons, magnitude-depth analysis,
hotspot rankings, data quality metrics, and DBSCAN clustering.
"""
from flask import Blueprint, request, jsonify
from backend.database.mongo import get_db
from backend.analytics.clustering import run_dbscan_clustering, compute_depth_magnitude_correlation

analytics_bp = Blueprint("analytics_bp", __name__, url_prefix="/api")

@analytics_bp.route("/overview", methods=["GET"])
def get_global_overview():
    """
    Returns global KPIs and high-level distributions derived from MongoDB.
    """
    db = get_db()
    col = db["earthquakes"]

    # 1. KPI Pipeline
    kpi_pipeline = [
        {
            "$group": {
                "_id": None,
                "total_earthquakes": {"$sum": 1},
                "avg_magnitude": {"$avg": "$magnitude"},
                "max_magnitude": {"$max": "$magnitude"},
                "min_magnitude": {"$min": "$magnitude"},
                "avg_depth_km": {"$avg": "$depth_km"},
                "total_tsunami_alerts": {"$sum": "$tsunami"}
            }
        }
    ]
    kpi_res = list(col.aggregate(kpi_pipeline))
    kpis = kpi_res[0] if kpi_res else {
        "total_earthquakes": 0, "avg_magnitude": 0, "max_magnitude": 0, "avg_depth_km": 0, "total_tsunami_alerts": 0
    }
    if "_id" in kpis:
        del kpis["_id"]
    kpis["avg_magnitude"] = round(kpis.get("avg_magnitude", 0) or 0, 2)
    kpis["max_magnitude"] = round(kpis.get("max_magnitude", 0) or 0, 2)
    kpis["avg_depth_km"] = round(kpis.get("avg_depth_km", 0) or 0, 2)

    # 2. Yearly Trend Pipeline
    yearly_pipeline = [
        {
            "$group": {
                "_id": "$year",
                "count": {"$sum": 1},
                "avg_mag": {"$avg": "$magnitude"},
                "max_mag": {"$max": "$magnitude"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    yearly_raw = list(col.aggregate(yearly_pipeline))
    yearly_trend = [
        {
            "year": item["_id"],
            "count": item["count"],
            "avg_magnitude": round(item["avg_mag"], 2),
            "max_magnitude": round(item["max_mag"], 2)
        }
        for item in yearly_raw if item["_id"] is not None
    ]

    # 3. Magnitude Distribution from magnitude_analysis collection
    mag_dist = list(db["magnitude_analysis"].find({}, {"_id": 0}).sort("lower_bound", 1))

    # 4. Recent significant recorded events (Top 6 latest)
    recent_events = list(col.find(
        {},
        {"_id": 0, "event_id": 1, "magnitude": 1, "place": 1, "date_str": 1, "depth_km": 1, "region_name": 1, "tsunami": 1, "location": 1}
    ).sort("timestamp_ms", -1).limit(6))

    # 5. Top 5 Highest Magnitude Events in Catalog
    highest_events = list(col.find(
        {},
        {"_id": 0, "event_id": 1, "magnitude": 1, "place": 1, "date_str": 1, "depth_km": 1, "region_name": 1, "tsunami": 1}
    ).sort("magnitude", -1).limit(5))

    return jsonify({
        "kpis": kpis,
        "yearly_trend": yearly_trend,
        "magnitude_distribution": mag_dist,
        "recent_events": recent_events,
        "highest_events": highest_events,
        "source": "USGS Comprehensive Catalog via MongoDB earthpulse_db"
    }), 200

@analytics_bp.route("/trends/yearly", methods=["GET"])
def get_yearly_trends():
    db = get_db()
    pipeline = [
        {
            "$group": {
                "_id": "$year",
                "earthquake_count": {"$sum": 1},
                "avg_magnitude": {"$avg": "$magnitude"},
                "max_magnitude": {"$max": "$magnitude"},
                "avg_depth_km": {"$avg": "$depth_km"},
                "tsunami_count": {"$sum": "$tsunami"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "year": "$_id",
                "earthquake_count": "$earthquake_count",
                "avg_magnitude": {"$round": ["$avg_magnitude", 2]},
                "max_magnitude": {"$round": ["$max_magnitude", 2]},
                "avg_depth_km": {"$round": ["$avg_depth_km", 2]},
                "tsunami_count": "$tsunami_count"
            }
        },
        {"$sort": {"year": 1}}
    ]
    results = list(db["earthquakes"].aggregate(pipeline))
    return jsonify({"yearly_trends": results}), 200

@analytics_bp.route("/trends/monthly", methods=["GET"])
def get_monthly_trends():
    db = get_db()
    year = request.args.get("year")
    region_id = request.args.get("region_id")

    query = {}
    if year:
        try: query["year"] = int(year)
        except ValueError: pass
    if region_id and region_id != "ALL":
        query["region_id"] = region_id

    # If specific filters applied, query monthly_summary or aggregate
    results = list(db["monthly_summary"].find(query, {"_id": 0}).sort([("year", 1), ("month", 1)]))

    # Also calculate aggregated timeline by Year-Month across all regions if region is ALL
    timeline_pipeline = [
        {"$match": query if "year" in query else {}},
        {
            "$group": {
                "_id": {
                    "year": "$year",
                    "month": "$month"
                },
                "total_events": {"$sum": "$event_count"},
                "avg_magnitude": {"$avg": "$avg_magnitude"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "year": "$_id.year",
                "month": "$_id.month",
                "period": {
                    "$concat": [{"$toString": "$_id.year"}, "-", {"$cond": [{"$lt": ["$_id.month", 10]}, {"$concat": ["0", {"$toString": "$_id.month"}]}, {"$toString": "$_id.month"}]}]
                },
                "total_events": "$total_events",
                "avg_magnitude": {"$round": ["$avg_magnitude", 2]}
            }
        },
        {"$sort": {"period": 1}}
    ]
    timeline = list(db["monthly_summary"].aggregate(timeline_pipeline))

    return jsonify({
        "monthly_records": results[:200],
        "aggregated_timeline": timeline
    }), 200

@analytics_bp.route("/magnitude/distribution", methods=["GET"])
def get_magnitude_distribution():
    db = get_db()
    bands = list(db["magnitude_analysis"].find({}, {"_id": 0}).sort("lower_bound", 1))
    return jsonify({"magnitude_distribution": bands}), 200

@analytics_bp.route("/depth/analysis", methods=["GET"])
def get_depth_analysis():
    db = get_db()

    # 1. Depth Distribution via $bucket
    bucket_pipeline = [
        {
            "$bucket": {
                "groupBy": "$depth_km",
                "boundaries": [0.0, 35.0, 70.0, 150.0, 300.0, 500.0, 1000.0],
                "default": "Other",
                "output": {
                    "count": {"$sum": 1},
                    "avg_magnitude": {"$avg": "$magnitude"},
                    "max_magnitude": {"$max": "$magnitude"}
                }
            }
        },
        {
            "$addFields": {
                "depth_interval": {
                    "$switch": {
                        "branches": [
                            {"case": {"$eq": ["$_id", 0.0]}, "then": "0 - 35 km (Very Shallow)"},
                            {"case": {"$eq": ["$_id", 35.0]}, "then": "35 - 70 km (Shallow)"},
                            {"case": {"$eq": ["$_id", 70.0]}, "then": "70 - 150 km (Intermediate I)"},
                            {"case": {"$eq": ["$_id", 150.0]}, "then": "150 - 300 km (Intermediate II)"},
                            {"case": {"$eq": ["$_id", 300.0]}, "then": "300 - 500 km (Deep I)"},
                            {"case": {"$eq": ["$_id", 500.0]}, "then": "500+ km (Deep Wadati-Benioff)"}
                        ],
                        "default": "Other"
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "interval": "$depth_interval",
                "lower_depth_km": "$_id",
                "count": "$count",
                "avg_magnitude": {"$round": ["$avg_magnitude", 2]},
                "max_magnitude": "$max_magnitude"
            }
        },
        {"$sort": {"lower_depth_km": 1}}
    ]
    depth_bands = list(db["earthquakes"].aggregate(bucket_pipeline))

    # 2. Representative sample for magnitude vs depth scatter plot (limit 600 points)
    scatter_sample = list(db["earthquakes"].aggregate([
        {"$sample": {"size": 600}},
        {
            "$project": {
                "_id": 0,
                "magnitude": "$magnitude",
                "depth_km": "$depth_km",
                "region_id": "$region_id",
                "place": "$place",
                "date_str": "$date_str"
            }
        }
    ]))

    # 3. Statistical correlation metrics
    stats_data = compute_depth_magnitude_correlation()

    return jsonify({
        "depth_intervals": depth_bands,
        "scatter_sample": scatter_sample,
        "statistical_correlation": stats_data
    }), 200

@analytics_bp.route("/regions", methods=["GET"])
def get_regions():
    db = get_db()
    regions = list(db["regions"].find({}, {"_id": 0}))
    return jsonify({"regions": regions}), 200

@analytics_bp.route("/regions/comparison", methods=["GET"])
def get_regional_comparison():
    db = get_db()
    pipeline = [
        {
            "$group": {
                "_id": "$region_id",
                "total_events": {"$sum": 1},
                "avg_magnitude": {"$avg": "$magnitude"},
                "max_magnitude": {"$max": "$magnitude"},
                "avg_depth_km": {"$avg": "$depth_km"},
                "tsunami_count": {"$sum": "$tsunami"}
            }
        },
        {
            "$lookup": {
                "from": "regions",
                "localField": "_id",
                "foreignField": "region_id",
                "as": "info"
            }
        },
        {
            "$project": {
                "_id": 0,
                "region_id": "$_id",
                "region_name": {"$arrayElemAt": ["$info.region_name", 0]},
                "hazard_level": {"$arrayElemAt": ["$info.hazard_level", 0]},
                "tectonic_setting": {"$arrayElemAt": ["$info.tectonic_setting", 0]},
                "total_events": "$total_events",
                "avg_magnitude": {"$round": ["$avg_magnitude", 2]},
                "max_magnitude": {"$round": ["$max_magnitude", 2]},
                "avg_depth_km": {"$round": ["$avg_depth_km", 2]},
                "tsunami_count": "$tsunami_count"
            }
        },
        {"$sort": {"total_events": -1}}
    ]
    results = list(db["earthquakes"].aggregate(pipeline))
    return jsonify({"regional_comparison": results}), 200

@analytics_bp.route("/hotspots", methods=["GET"])
def get_hotspots():
    db = get_db()
    tier = request.args.get("tier")
    query = {}
    if tier and tier != "ALL":
        query["seismic_density_tier"] = tier

    hotspots = list(db["hotspot_cells"].find(query, {"_id": 0}).sort("earthquake_count", -1).limit(200))
    return jsonify({
        "total_hotspots": len(hotspots),
        "hotspots": hotspots
    }), 200

@analytics_bp.route("/clustering/dbscan", methods=["GET"])
def get_dbscan_clusters():
    eps_km = float(request.args.get("eps_km", 350.0))
    min_samples = int(request.args.get("min_samples", 15))
    res = run_dbscan_clustering(eps_km=eps_km, min_samples=min_samples)
    return jsonify(res), 200

@analytics_bp.route("/data-quality", methods=["GET"])
def get_data_quality():
    import json
    import os
    from backend.config import Config

    db = get_db()
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    q_file = os.path.join(base_dir, "data", "processed", "data_quality_report.json")
    recon_file = os.path.join(base_dir, "powerbi", "exports", "reconciliation_audit.json")

    audit_data = {}
    if os.path.exists(q_file):
        with open(q_file, "r", encoding="utf-8") as f:
            audit_data = json.load(f)

    recon_data = {}
    if os.path.exists(recon_file):
        with open(recon_file, "r", encoding="utf-8") as f:
            recon_data = json.load(f)

    # MongoDB collection statistics
    col_names = db.list_collection_names()
    stats = {}
    for c in col_names:
        stats[c] = {
            "document_count": db[c].count_documents({}),
            "indexes": list(db[c].index_information().keys())
        }

    # Big Data 5 Vs definition & real project evidence
    five_vs = {
        "Volume": {
            "concept": "Massive historical scale beyond traditional single-file handling.",
            "implementation": f"Imported {db['earthquakes'].count_documents({})} verified seismic event documents with 26+ MB cleaned GeoJSON spanning 25 years (2000-2025)."
        },
        "Variety": {
            "concept": "Diverse structural formats, GeoJSON geometry, multi-magnitude types, and varying sensor sources.",
            "implementation": "Handles Point geometry [lon, lat], multi-tier magnitude scales (mww, mb, mwc, ms), tsunami indicators, and nested USGS origin metadata."
        },
        "Velocity": {
            "concept": "Continuous ingestion, rate management, and repeatable batch pipelines.",
            "implementation": "Demonstrates modular API extraction with chunking, retry backoff, bulk upserts, and administrative pipeline trigger endpoints."
        },
        "Veracity": {
            "concept": "Data reliability, precision, filtering out anomalies, and coordinate validation.",
            "implementation": "Rejects malformed bounding box coordinates, deduplicates event IDs, normalizes timestamps, and reconciles records with zero discrepancy."
        },
        "Value": {
            "concept": "Extracting actionable scientific insights, hazard zone identification, and disaster preparedness.",
            "implementation": "Provides spatial hotspot cell clustering, temporal trend visualization, depth-magnitude regression, and Power BI executive dashboards."
        }
    }

    return jsonify({
        "collection_statistics": stats,
        "etl_audit_summary": audit_data,
        "reconciliation": recon_data,
        "big_data_5vs": five_vs
    }), 200

@analytics_bp.route("/ingestion/logs", methods=["GET"])
def get_ingestion_logs():
    db = get_db()
    logs = list(db["ingestion_logs"].find({}, {"_id": 0}).sort("started_at", -1).limit(20))
    return jsonify({"ingestion_logs": logs}), 200
