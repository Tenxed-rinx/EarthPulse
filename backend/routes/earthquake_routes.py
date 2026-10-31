"""
EarthPulse Earthquake Query & Geospatial API Routes
Provides paginated filtering, single-event lookups, geospatial $geoNear queries, and CSV exports.
"""
from flask import Blueprint, request, jsonify, Response
from backend.database.mongo import get_db

earthquake_bp = Blueprint("earthquake_bp", __name__, url_prefix="/api")

@earthquake_bp.route("/earthquakes", methods=["GET"])
def get_earthquakes():
    """
    Paginated earthquake retrieval with multi-criteria filtering.
    """
    db = get_db()
    
    # Pagination parameters
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = min(500, max(1, int(request.args.get("limit", 50))))
    except ValueError:
        return jsonify({"error": "Invalid page or limit parameter."}), 400

    query = {}

    # Magnitude filtering
    min_mag = request.args.get("min_mag")
    max_mag = request.args.get("max_mag")
    if min_mag is not None or max_mag is not None:
        query["magnitude"] = {}
        if min_mag is not None:
            try: query["magnitude"]["$gte"] = float(min_mag)
            except ValueError: pass
        if max_mag is not None:
            try: query["magnitude"]["$lte"] = float(max_mag)
            except ValueError: pass

    # Depth filtering
    min_depth = request.args.get("min_depth")
    max_depth = request.args.get("max_depth")
    if min_depth is not None or max_depth is not None:
        query["depth_km"] = {}
        if min_depth is not None:
            try: query["depth_km"]["$gte"] = float(min_depth)
            except ValueError: pass
        if max_depth is not None:
            try: query["depth_km"]["$lte"] = float(max_depth)
            except ValueError: pass

    # Date range filtering
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    if start_date or end_date:
        query["date_str"] = {}
        if start_date:
            query["date_str"]["$gte"] = start_date
        if end_date:
            query["date_str"]["$lte"] = end_date

    # Region filtering
    region_id = request.args.get("region_id")
    if region_id and region_id != "ALL":
        query["region_id"] = region_id

    # Magnitude band
    mag_band = request.args.get("magnitude_band")
    if mag_band and mag_band != "ALL":
        query["magnitude_band"] = mag_band

    # Tsunami filter
    tsunami = request.args.get("tsunami")
    if tsunami in ["1", "true", "True"]:
        query["tsunami"] = 1

    # Text search on place
    search = request.args.get("search")
    if search:
        query["place"] = {"$regex": search, "$options": "i"}

    # Sorting
    sort_by = request.args.get("sort_by", "time")
    order = -1 if request.args.get("order", "desc").lower() == "desc" else 1

    sort_field_map = {
        "time": "timestamp_ms",
        "magnitude": "magnitude",
        "depth": "depth_km",
        "significance": "significance"
    }
    field_to_sort = sort_field_map.get(sort_by, "timestamp_ms")

    col = db["earthquakes"]
    total_matching = col.count_documents(query)
    skip = (page - 1) * limit

    cursor = col.find(
        query,
        {
            "_id": 0,
            "event_id": 1,
            "magnitude": 1,
            "mag_type": 1,
            "place": 1,
            "event_time": 1,
            "timestamp_ms": 1,
            "depth_km": 1,
            "date_str": 1,
            "region_id": 1,
            "region_name": 1,
            "magnitude_band": 1,
            "depth_band": 1,
            "tsunami": 1,
            "significance": 1,
            "location": 1
        }
    ).sort(field_to_sort, order).skip(skip).limit(limit)

    records = list(cursor)

    return jsonify({
        "page": page,
        "limit": limit,
        "total_records": total_matching,
        "total_pages": (total_matching + limit - 1) // limit if limit else 1,
        "results_count": len(records),
        "earthquakes": records
    }), 200

@earthquake_bp.route("/earthquakes/<event_id>", methods=["GET"])
def get_earthquake_detail(event_id):
    """
    Returns complete document metadata for an earthquake event.
    """
    db = get_db()
    event = db["earthquakes"].find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        return jsonify({"error": f"Earthquake event '{event_id}' not found."}), 404
    return jsonify({"earthquake": event}), 200

@earthquake_bp.route("/nearby", methods=["GET"])
def get_nearby_earthquakes():
    """
    Demonstrates MongoDB Geospatial 2dsphere $geoNear pipeline.
    Finds historical earthquakes within a specified radius of coordinates.
    """
    try:
        lat = float(request.args.get("lat", 0.0))
        lon = float(request.args.get("lon", 0.0))
        max_dist_km = float(request.args.get("max_distance_km", 500.0))
        min_mag = float(request.args.get("min_mag", 5.0))
        limit = min(200, int(request.args.get("limit", 50)))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid coordinates or numerical parameters."}), 400

    db = get_db()
    # MongoDB $geoNear operates in meters for 2dsphere
    max_meters = max_dist_km * 1000.0

    pipeline = [
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "distanceField": "distance_meters",
                "maxDistance": max_meters,
                "spherical": True,
                "query": {
                    "magnitude": {"$gte": min_mag}
                }
            }
        },
        {
            "$addFields": {
                "distance_km": {"$round": [{"$divide": ["$distance_meters", 1000.0]}, 2]}
            }
        },
        {
            "$project": {
                "_id": 0,
                "event_id": 1,
                "magnitude": 1,
                "place": 1,
                "date_str": 1,
                "depth_km": 1,
                "region_name": 1,
                "distance_km": 1,
                "location": 1,
                "tsunami": 1
            }
        },
        {"$limit": limit}
    ]

    try:
        results = list(db["earthquakes"].aggregate(pipeline))
        return jsonify({
            "query_center": {"latitude": lat, "longitude": lon},
            "radius_km": max_dist_km,
            "min_magnitude": min_mag,
            "results_count": len(results),
            "nearby_earthquakes": results
        }), 200
    except Exception as e:
        return jsonify({"error": f"Geospatial aggregation failed: {str(e)}"}), 500

@earthquake_bp.route("/export/csv", methods=["GET"])
def export_filtered_csv():
    """
    Streams filtered earthquake records as CSV for Analyst/Researcher export.
    """
    import io
    import csv

    db = get_db()
    query = {}
    region_id = request.args.get("region_id")
    if region_id and region_id != "ALL":
        query["region_id"] = region_id
    min_mag = request.args.get("min_mag")
    if min_mag:
        try: query["magnitude"] = {"$gte": float(min_mag)}
        except ValueError: pass

    cursor = db["earthquakes"].find(
        query,
        {
            "_id": 0,
            "event_id": 1,
            "date_str": 1,
            "magnitude": 1,
            "depth_km": 1,
            "place": 1,
            "region_name": 1,
            "location.coordinates": 1,
            "tsunami": 1,
            "significance": 1
        }
    ).sort("timestamp_ms", -1).limit(5000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["event_id", "date", "magnitude", "depth_km", "place", "region", "longitude", "latitude", "tsunami", "significance"])

    for doc in cursor:
        coords = doc.get("location", {}).get("coordinates", [0, 0])
        writer.writerow([
            doc.get("event_id"),
            doc.get("date_str"),
            doc.get("magnitude"),
            doc.get("depth_km"),
            doc.get("place"),
            doc.get("region_name"),
            coords[0] if len(coords) >= 1 else 0,
            coords[1] if len(coords) >= 2 else 0,
            doc.get("tsunami", 0),
            doc.get("significance", 0)
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=earthpulse_export.csv"}
    )
