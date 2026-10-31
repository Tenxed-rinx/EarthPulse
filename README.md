# EarthPulse – Global Earthquake Data Mining and Analytics Platform
> **Academic Big Data Mining (BDM) Capstone Project**  
> *MongoDB Community Edition &bull; Python Flask &bull; React.js &bull; TypeScript &bull; Leaflet &bull; Power BI*

---

## 1. Project Overview
**EarthPulse** is an end-to-end Big Data Mining and spatial-temporal analytics platform built upon **26,170 verified historical earthquake records** extracted directly from the **USGS Comprehensive Earthquake Catalog (ComCat)** spanning 25 years (2000 to 2025).

Unlike superficial dashboard prototypes, the database architecture and analytical processing in EarthPulse are central:
- **Database Engine**: MongoDB Community Edition (`earthpulse_db`)
- **Geospatial Processing**: GeoJSON Point geometry with **`2dsphere`** indexing and spherical `$geoNear` radius queries
- **Server-Side Aggregations**: Native MongoDB pipelines utilizing `$match`, `$group`, `$project`, `$sort`, `$lookup`, `$bucket`, and `$addFields`
- **Advanced Data Mining**: Unsupervised spatial density clustering (Scikit-Learn **DBSCAN**) and lithospheric focal depth vs. magnitude correlation analysis
- **Business Intelligence**: Relational Star-Schema export with Power BI Desktop report (`EarthPulse_Report.pbix`) and **100% verified zero-record discrepancy reconciliation**

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Database** | MongoDB Community Edition (v7.0+), MongoDB Compass, PyMongo |
| **Data Engineering & ETL** | Python 3.12, Requests, Pandas, NumPy, JSON Schema Validation |
| **Backend API** | Python Flask, Flask-CORS, PyJWT, Werkzeug (Password Hashing) |
| **Advanced Data Mining** | Scikit-Learn (DBSCAN Spatial Clustering), SciPy (Pearson & Spearman Correlation) |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **Mapping & Charts** | Leaflet.js, OpenStreetMap (Carto Dark), Recharts |
| **Business Intelligence** | Power BI Desktop, Relational Star-Schema CSVs, DAX Formulas |
| **Academic Documentation**| Python-Docx (`EarthPulse_BDM_Project_Report.docx`), Matplotlib |

---

## 3. Quick Start & Execution Guide (Windows)

### Prerequisites
1. **Python 3.10+** (Python 3.12 verified)
2. **Node.js v18+ & npm** (Node v22.21 verified)
3. **MongoDB Community Edition** running locally on `localhost:27017`

---

### Step 1: Set Up & Activate Backend Virtual Environment
Open PowerShell in the project directory:
```powershell
cd "d:\BDM project"

# Create and activate virtual environment
python -m venv backend\venv
.\backend\venv\Scripts\activate

# Install dependencies
pip install -r backend\requirements.txt
```

---

### Step 2: Execute Master End-to-End ETL Pipeline
A single documented command downloads data, cleans records, configures indexes, loads into MongoDB, builds summaries, and exports Power BI tables:
```powershell
.\backend\venv\Scripts\python.exe scripts\run_etl_pipeline.py
```

**What this script performs:**
1. **`download_data.py`**: Extracts USGS GeoJSON events in 2-year intervals with exponential backoff.
2. **`clean_data.py`**: Validates coordinate bounds, filters invalid depths, assigns tectonic regions, and computes 2° grid cell IDs.
3. **`create_indexes.py`**: Configures `idx_unique_event_id`, `idx_geospatial_2dsphere`, and compound indexes.
4. **`import_mongodb.py`**: Bulk upserts 26,170 documents into `earthpulse_db.earthquakes` and seeds user accounts.
5. **`generate_summaries.py`**: Executes native aggregation pipelines populating `monthly_summary`, `daily_summary`, `magnitude_analysis`, and `hotspot_cells`.
6. **`export_powerbi.py`**: Generates relational CSV tables in `powerbi/exports/` and writes the reconciliation audit.

---

### Step 3: Start the Flask Backend API
```powershell
.\backend\venv\Scripts\python.exe backend\app.py
```
*API will start on `http://localhost:5000`.* Verify health at `http://localhost:5000/api/health`.

---

### Step 4: Start the React Frontend Web Application
Open a new PowerShell window:
```powershell
cd "d:\BDM project\frontend"

# Install frontend packages (already scaffolded)
npm install

# Run Vite development server
npm run dev
```
*Frontend will launch at `http://localhost:3000`.*

---

## 4. Default Seed Authentication Accounts
The system enforces JWT role-based access control (RBAC):

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full administrative control: trigger ETL refreshes, inspect engine stats, and manage user roles. |
| **Researcher / Analyst** | `analyst` | `analyst123` | Advanced analysis: scatter dispersion, DBSCAN clusters, and direct CSV dataset download. |
| **Public Viewer** | `viewer` | `viewer123` | Public access: global map, overview KPIs, and historical timelines. |

---

## 5. Automated Verification & Testing
Run the comprehensive automated unit and integration test suite:
```powershell
.\backend\venv\Scripts\python.exe backend\tests\test_verification_suite.py
```
*Verifies 10 core integration tests including MongoDB records, unique index duplicate prevention, coordinate bounds, geospatial `$geoNear`, aggregation summaries, Flask endpoints, and Power BI reconciliation.*

---

## 6. Power BI Desktop Reporting
The project includes a ready-to-open Power BI report archive:
- **Report File**: `powerbi/EarthPulse_Report.pbix`
- **Data Model Guide & DAX Specifications**: `powerbi/PowerBI_Data_Model_and_DAX_Guide.md`
- **Exported Star-Schema Relational Tables**:
  - `powerbi/exports/fact_earthquakes.csv` (26,170 rows)
  - `powerbi/exports/dim_date.csv` (8,232 calendar days)
  - `powerbi/exports/dim_region.csv` (10 tectonic regions)
  - `powerbi/exports/dim_magnitude_band.csv` (6 bands)
  - `powerbi/exports/dim_depth_band.csv` (3 depth regimes)
  - `powerbi/exports/reconciliation_audit.json`

### To Open in Power BI Desktop:
1. Launch **Power BI Desktop**.
2. Open `powerbi/EarthPulse_Report.pbix` or import tables via **Get Data -> Text/CSV** from `powerbi/exports/`.
3. To refresh data after any new ingestion, click **Home -> Refresh**.

---

## 7. Academic Deliverables & Project Report
- **Academic Project Report (DOCX)**: `EarthPulse_BDM_Project_Report.docx` and `docs/reports/EarthPulse_BDM_Project_Report.docx` (800+ KB with embedded architecture diagrams and empirical results).
- **Architecture Diagrams**: `docs/architecture/system_architecture.png`
- **Analytical Figures**: `docs/screenshots/`

---

## 8. Big Data 5 Vs Demonstrated

- **Volume**: 26,170 real seismic events spanning 25 years (2000–2025). Cleaned document volume exceeds 26 MB in MongoDB.
- **Variety**: Multi-structured data with GeoJSON Point geometry, varied magnitude types (mww, mb, mwc), focal depths, and origin station metadata.
- **Velocity**: Systematic batch ingestion with chunking, retry backoff, bulk upserts, and administrative pipeline trigger endpoints.
- **Veracity**: Automated duplicate rejection via unique event IDs, physical coordinate bounds verification, and 100% mathematical reconciliation.
- **Value**: Spatial hotspot grid clustering (919 cells), lithospheric depth-magnitude statistical regression, and interactive emergency-planning visualization.
