# EarthPulse API Documentation & Complete Reference Guide

**Base URL**: `http://localhost:5000/api`  
**Database**: `earthpulse_db` (MongoDB Community Edition v7.0+)  
**Dataset**: 26,170 Real USGS ComCat Seismic Events (2000–2025)  

---

## 1. Quick Start: Starting Backend & Frontend

### Start Backend API:
```powershell
cd "d:\BDM project"
.\backend\venv\Scripts\python.exe backend\app.py
```
*API will start on `http://localhost:5000`.* Test health at `http://localhost:5000/api/health`.

### Start Frontend UI:
```powershell
cd "d:\BDM project\frontend"
npm run dev
```
*Frontend will launch at `http://localhost:3000`.*

---

## 2. API Endpoints Catalog

### Category 1: Health & Diagnostics

#### `GET /api/health`
Checks API server and MongoDB database connection status.
- **Access**: Public
- **Example Response**:
```json
{
  "mongodb": {
    "connected": true,
    "database": "earthpulse_db",
    "earthquake_documents": 26170,
    "message": "MongoDB connected successfully"
  },
  "service": "EarthPulse Big Data Mining API",
  "status": "healthy"
}
```

---

### Category 2: Global Overview & Earthquake Records

#### `GET /api/overview`
Returns global KPIs (total events, average magnitude, max magnitude, depth, tsunami count), recent events, and historical maxima.
- **Access**: Public
- **Example Response**:
```json
{
  "kpis": {
    "total_earthquakes": 26170,
    "avg_magnitude": 5.24,
    "max_magnitude": 9.1,
    "avg_depth_km": 57.34,
    "total_tsunami_alerts": 1842
  },
  "recent_events": [...],
  "highest_events": [...]
}
```

#### `GET /api/earthquakes`
Paginated search and multi-criteria filtering across 26,170 events.
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Events per page (default: `50`, max: `500`)
  - `min_mag`: Minimum magnitude (e.g. `6.0`)
  - `max_mag`: Maximum magnitude
  - `min_depth`: Minimum depth in km
  - `max_depth`: Maximum depth in km
  - `region_id`: Region code (e.g. `RING_OF_FIRE`, `MEDITERRANEAN`, `HIMALAYAN`)
  - `tsunami_only`: `true` or `false`
  - `sort`: `time_desc`, `mag_desc`, `depth_desc`
- **Access**: Public

#### `GET /api/earthquakes/<event_id>`
Fetches detailed record for a specific USGS event (e.g. `official20110311054624120_30`).

---

### Category 3: Native Geospatial ($geoNear)

#### `GET /api/nearby`
Executes native MongoDB `$geoNear` spherical aggregation on the `2dsphere` index.
- **Query Parameters**:
  - `lat`: Latitude in degrees (e.g. `35.6762`)
  - `lon`: Longitude in degrees (e.g. `139.6503`)
  - `max_distance_km`: Radius in kilometers (default: `500`)
  - `min_mag`: Minimum magnitude threshold (default: `5.0`)
- **Example Call**:
  `GET /api/nearby?lat=35.6762&lon=139.6503&max_distance_km=500&min_mag=6.0`

---

### Category 4: Temporal Analytics & Time Series

#### `GET /api/trends/yearly`
Returns annual seismic frequency and average/maximum magnitude trends across 25 years.
- **Access**: Public

#### `GET /api/trends/monthly`
Returns monthly aggregation pipeline summaries.
- **Query Parameters**:
  - `year`: (Optional) e.g. `2024`
  - `region_id`: (Optional) Filter by specific region

---

### Category 5: Regional Explorer & Hotspots

#### `GET /api/regions`
Returns metadata and polygon coordinates for all 10 global tectonic regions.

#### `GET /api/regions/comparison`
Returns aggregated comparative metrics across regions:
- `region_name`, `total_events`, `avg_magnitude`, `max_magnitude`, `avg_depth_km`.

#### `GET /api/hotspots`
Returns high-density 2° x 2° spatial grid cells.
- **Query Parameter**: `tier` (`CRITICAL`, `HIGH`, `MODERATE`)

---

### Category 6: Magnitude & Depth Analytics & Data Mining

#### `GET /api/magnitude/distribution`
Returns event frequency aggregated into standard seismic magnitude bands (M4.5-5.0, M5.0-6.0, M6.0-7.0, M7.0+).

#### `GET /api/depth/analysis`
Returns focal depth regime stratification (Shallow, Intermediate, Deep) and statistical scatter sample.

#### `GET /api/clustering/dbscan`
Executes unsupervised spatial DBSCAN clustering using the Haversine metric.
- **Query Parameters**:
  - `eps_km`: Cluster radius in km (default: `350`)
  - `min_samples`: Minimum events to form a cluster (default: `15`)

---

### Category 7: Data Quality & Ingestion Auditing

#### `GET /api/data-quality`
Returns data hygiene verification:
- Total records, duplicate count, coordinate validity checks, collection disk storage sizes, and the 100% zero-discrepancy reconciliation audit.

#### `GET /api/ingestion/logs`
Returns historical ETL pipeline execution logs and status.

---

### Category 8: Authentication & Role-Based Access Control (RBAC)

#### `POST /api/auth/login`
- **Body**: `{ "username": "admin", "password": "admin123" }`
- **Response**: JWT token and user profile.

#### `POST /api/auth/register`
- **Body**: `{ "username": "...", "email": "...", "password": "...", "full_name": "..." }`

#### `GET /api/auth/me`
Returns active user session (Requires `Authorization: Bearer <token>`).

#### `GET /api/auth/users`
Lists all registered user accounts (Requires `admin` role).

#### `PUT /api/auth/users/<username>/role`
Updates a user's role to `viewer`, `analyst`, or `admin` (Requires `admin` role).

---

### Category 9: Administrator Operations

#### `POST /api/admin/refresh-summaries`
Recomputes MongoDB aggregation collections (`monthly_summary`, `hotspot_cells`, etc.) and regenerates Power BI CSV exports.
- **Access**: Admin only (`Authorization: Bearer <token>`)

#### `GET /api/admin/db-stats`
Returns low-level MongoDB engine diagnostics (objects, data size, storage size, index size).
- **Access**: Admin only

#### `GET /api/export/csv`
Downloads curated CSV dataset matching user filter criteria.

---

## 3. How to Test APIs in Terminal or Browser

### Test via Browser:
Simply open any of these URLs in Chrome/Edge:
* `http://localhost:5000/api/health`
* `http://localhost:5000/api/overview`
* `http://localhost:5000/api/regions/comparison`
* `http://localhost:5000/api/trends/yearly`
* `http://localhost:5000/api/magnitude/distribution`
* `http://localhost:5000/api/depth/analysis`
* `http://localhost:5000/api/data-quality`

### Test via PowerShell:
```powershell
# Get health status
Invoke-RestMethod -Uri "http://localhost:5000/api/health"

# Get global overview
Invoke-RestMethod -Uri "http://localhost:5000/api/overview"

# Query quakes near Tokyo (lat 35.68, lon 139.69, 500 km radius, min magnitude 6.0)
Invoke-RestMethod -Uri "http://localhost:5000/api/nearby?lat=35.68&lon=139.69&max_distance_km=500&min_mag=6.0"
```
