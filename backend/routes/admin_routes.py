"""
EarthPulse Administrator API Routes
Allows authenticated administrators to trigger ETL pipelines, refresh MongoDB aggregation collections,
and inspect database engine diagnostics.
"""
from flask import Blueprint, jsonify
from backend.database.mongo import get_db
from backend.services.auth_service import require_role
from scripts.generate_summaries import verify_all_aggregations
from scripts.export_powerbi import export_powerbi_data

admin_bp = Blueprint("admin_bp", __name__, url_prefix="/api/admin")

@admin_bp.route("/refresh-summaries", methods=["POST"])
@require_role("admin")
def trigger_refresh_summaries():
    """
    Recomputes derived analytical collections in MongoDB.
    """
    try:
        verify_all_aggregations()
        export_powerbi_data()
        return jsonify({
            "message": "Derived analytical collections and Power BI exports refreshed successfully.",
            "status": "SUCCESS"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to refresh summaries: {str(e)}"}), 500

@admin_bp.route("/db-stats", methods=["GET"])
@require_role("admin")
def get_db_stats():
    """
    Returns low-level MongoDB database engine statistics.
    """
    try:
        db = get_db()
        stats = db.command("dbStats")
        # Format bytes to MB for display
        return jsonify({
            "database_name": stats.get("db"),
            "collections_count": stats.get("collections"),
            "views_count": stats.get("views"),
            "objects_count": stats.get("objects"),
            "data_size_mb": round(stats.get("dataSize", 0) / (1024 * 1024), 2),
            "storage_size_mb": round(stats.get("storageSize", 0) / (1024 * 1024), 2),
            "indexes_count": stats.get("indexes"),
            "index_size_mb": round(stats.get("indexSize", 0) / (1024 * 1024), 2)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Could not retrieve dbStats: {str(e)}"}), 500
