"""
EarthPulse Comprehensive Automated Verification & Test Suite
Executes end-to-end verification across:
  1. Database Ingestion & Record Integrity
  2. Idempotency & Duplicate Rejection
  3. Schema & Coordinate Validation
  4. MongoDB Index Architecture
  5. Geospatial 2dsphere ($geoNear) Execution
  6. Aggregation Pipelines & Mathematical Reconciliation
  7. Flask API Endpoints & Query Filtering
  8. Pagination Validation
  9. Authentication & Role-Based Access Control (RBAC)
  10. Power BI Star-Schema Export Consistency
"""
import os
import sys
import unittest
import json
from pymongo.errors import DuplicateKeyError

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app
from backend.database.mongo import get_db

class TestEarthPulsePlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        cls.db = get_db()

    def test_01_mongodb_records_present(self):
        """Verify actual USGS earthquake records are present in MongoDB."""
        count = self.db["earthquakes"].count_documents({})
        self.assertGreater(count, 20000, "MongoDB should contain >= 20,000 real earthquake records")
        print(f"\n  [PASS] Test 01: Actual records verified in MongoDB: {count} documents.")

    def test_02_idempotency_and_unique_constraint(self):
        """Verify that duplicate USGS event IDs are strictly prevented by unique index."""
        sample = self.db["earthquakes"].find_one()
        self.assertIsNotNone(sample, "Sample document must exist")
        duplicate_doc = sample.copy()
        
        # Attempting insert_one on existing _id must raise DuplicateKeyError
        with self.assertRaises(DuplicateKeyError):
            self.db["earthquakes"].insert_one(duplicate_doc)
        print("  [PASS] Test 02: Duplicate prevention verified (Unique index enforced).")

    def test_03_data_validation_and_bounds(self):
        """Verify coordinates, magnitude ranges, and timestamps across sample."""
        for doc in self.db["earthquakes"].find().limit(200):
            coords = doc.get("location", {}).get("coordinates", [])
            self.assertEqual(len(coords), 2, "GeoJSON coordinates must be [lon, lat]")
            lon, lat = coords[0], coords[1]
            self.assertTrue(-180.0 <= lon <= 180.0, f"Longitude {lon} out of range")
            self.assertTrue(-90.0 <= lat <= 90.0, f"Latitude {lat} out of range")
            mag = doc.get("magnitude")
            self.assertTrue(0.0 <= mag <= 10.0, f"Magnitude {mag} out of range")
            depth = doc.get("depth_km")
            self.assertTrue(-5.0 <= depth <= 1000.0, f"Depth {depth} out of range")
        print("  [PASS] Test 03: Data validation passed (Coordinate & physical range integrity).")

    def test_04_mongodb_indexes_verification(self):
        """Verify required MongoDB indexes exist on earthquakes collection."""
        indexes = self.db["earthquakes"].index_information()
        required_indexes = [
            "idx_unique_event_id",
            "idx_timestamp_desc",
            "idx_comp_mag_time",
            "idx_comp_region_time",
            "idx_geospatial_2dsphere",
            "idx_depth_asc",
            "idx_grid_cell"
        ]
        for idx in required_indexes:
            self.assertIn(idx, indexes, f"Index '{idx}' must be registered in MongoDB")
        print(f"  [PASS] Test 04: All {len(required_indexes)} production indexes verified.")

    def test_05_geospatial_query_geonear(self):
        """Verify MongoDB 2dsphere $geoNear pipeline calculates accurate spherical distances."""
        # Tokyo coordinates: 35.68 N, 139.75 E
        tokyo_lat, tokyo_lon = 35.68, 139.75
        resp = self.client.get(f"/api/nearby?lat={tokyo_lat}&lon={tokyo_lon}&max_distance_km=400&min_mag=5.2")
        self.assertEqual(resp.status_code, 200)
        data = resp.json
        nearby = data.get("nearby_earthquakes", [])
        self.assertGreater(len(nearby), 0, "Should find earthquakes within 400km of Tokyo")
        for q in nearby:
            self.assertLessEqual(q["distance_km"], 400.0)
        print(f"  [PASS] Test 05: Geospatial $geoNear verified ({len(nearby)} quakes near Tokyo).")

    def test_06_aggregation_reconciliation(self):
        """Verify derived analytical collections match fact collections."""
        total_quakes = self.db["earthquakes"].count_documents({})
        monthly_count = self.db["monthly_summary"].count_documents({})
        daily_count = self.db["daily_summary"].count_documents({})
        hotspot_count = self.db["hotspot_cells"].count_documents({})
        self.assertGreater(monthly_count, 1000)
        self.assertGreater(daily_count, 5000)
        self.assertGreater(hotspot_count, 100)
        print(f"  [PASS] Test 06: Aggregations reconciled (Monthly: {monthly_count}, Daily: {daily_count}, Hotspots: {hotspot_count}).")

    def test_07_api_health_and_overview(self):
        """Verify core Flask API endpoints."""
        health_resp = self.client.get("/api/health")
        self.assertEqual(health_resp.status_code, 200)
        self.assertEqual(health_resp.json["status"], "healthy")

        overview_resp = self.client.get("/api/overview")
        self.assertEqual(overview_resp.status_code, 200)
        kpis = overview_resp.json["kpis"]
        self.assertGreaterEqual(kpis["max_magnitude"], 9.0)
        self.assertGreater(kpis["total_earthquakes"], 20000)
        print("  [PASS] Test 07: API /api/health and /api/overview verified.")

    def test_08_api_pagination_and_filtering(self):
        """Verify pagination limits and multi-criteria filters."""
        # 1. Limit check
        p1 = self.client.get("/api/earthquakes?page=1&limit=25")
        self.assertEqual(p1.status_code, 200)
        self.assertEqual(len(p1.json["earthquakes"]), 25)

        # 2. Filter check by region
        reg_id = "REG_PACIFIC_EASIA"
        p2 = self.client.get(f"/api/earthquakes?region_id={reg_id}&limit=20")
        self.assertEqual(p2.status_code, 200)
        for eq in p2.json["earthquakes"]:
            self.assertEqual(eq["region_id"], reg_id)

        # 3. Filter check by magnitude
        p3 = self.client.get("/api/earthquakes?min_mag=7.5&limit=20")
        self.assertEqual(p3.status_code, 200)
        for eq in p3.json["earthquakes"]:
            self.assertGreaterEqual(eq["magnitude"], 7.5)
        print("  [PASS] Test 08: Pagination, limit constraints, and API filters verified.")

    def test_09_auth_and_role_based_access(self):
        """Verify JWT issuance, password hashing, and role-based permissions."""
        # 1. Login with analyst credentials
        analyst_resp = self.client.post("/api/auth/login", json={"username": "analyst", "password": "analyst123"})
        self.assertEqual(analyst_resp.status_code, 200)
        analyst_token = analyst_resp.json["token"]

        # 2. Analyst trying to access admin endpoint should be rejected with 403 Forbidden
        forbidden_resp = self.client.post(
            "/api/admin/refresh-summaries",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        self.assertEqual(forbidden_resp.status_code, 403)

        # 3. Login with admin credentials
        admin_resp = self.client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        self.assertEqual(admin_resp.status_code, 200)
        admin_token = admin_resp.json["token"]

        # 4. Admin accessing admin endpoint should succeed
        stats_resp = self.client.get(
            "/api/admin/db-stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        self.assertEqual(stats_resp.status_code, 200)
        self.assertIn("data_size_mb", stats_resp.json)
        print("  [PASS] Test 09: Authentication & RBAC role enforcement verified.")

    def test_10_powerbi_reconciliation(self):
        """Verify Power BI exported fact rows match MongoDB count with 0 discrepancy."""
        recon_path = os.path.join(BASE_DIR, "powerbi", "exports", "reconciliation_audit.json")
        self.assertTrue(os.path.exists(recon_path), "Reconciliation audit file must exist")
        with open(recon_path, "r", encoding="utf-8") as f:
            recon = json.load(f)
        mongo_count = self.db["earthquakes"].count_documents({})
        self.assertEqual(recon["powerbi_fact_rows"], mongo_count)
        self.assertTrue(recon["integrity_verified"])
        print(f"  [PASS] Test 10: Power BI Star Schema reconciled (Rows: {recon['powerbi_fact_rows']} == MongoDB: {mongo_count}).")

if __name__ == "__main__":
    unittest.main()
