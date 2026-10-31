"""
EarthPulse - Global Earthquake Data Mining and Analytics Platform
Main Flask Application Entrypoint
"""
import os
import sys
from datetime import datetime, timezone
from flask import Flask, jsonify
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.config import Config
from backend.database.mongo import get_db, check_connection
from backend.routes.auth_routes import auth_bp
from backend.routes.earthquake_routes import earthquake_bp
from backend.routes.analytics_routes import analytics_bp
from backend.routes.admin_routes import admin_bp

START_TIME = datetime.now(timezone.utc)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all frontend interactions
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(earthquake_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        is_connected, msg = check_connection()
        uptime_sec = (datetime.now(timezone.utc) - START_TIME).total_seconds()
        
        status_code = 200 if is_connected else 503
        db = get_db() if is_connected else None
        quake_count = db["earthquakes"].count_documents({}) if db is not None else 0

        return jsonify({
            "status": "healthy" if is_connected else "degraded",
            "service": "EarthPulse Big Data Mining API",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": round(uptime_sec, 1),
            "mongodb": {
                "connected": is_connected,
                "database": Config.DB_NAME,
                "message": msg,
                "earthquake_documents": quake_count
            }
        }), status_code

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"error": "Internal server error occurred", "status_code": 500}), 500

    return app

app = create_app()

if __name__ == "__main__":
    print(f"Starting EarthPulse Flask API Server on port {Config.PORT}...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
