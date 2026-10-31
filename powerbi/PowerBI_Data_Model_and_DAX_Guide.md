# EarthPulse – Power BI Analytical Report & Data Model Guide

## 1. Executive Summary & Star Schema Architecture
This Power BI reporting solution connects directly to relational fact and dimension tables exported from the native MongoDB **`earthpulse_db`** database.
It adheres strictly to a dimensional **Star-Schema** modeling pattern:

```
                  +---------------------------+
                  |         dim_date          |
                  |---------------------------|
                  | * date_str (PK)           |
                  |   year, month, quarter    |
                  +-------------+-------------+
                                | 1
                                |
                                | *
+-----------------------+     +-------------------------------+     +---------------------------+
|      dim_region       |     |        fact_earthquakes       |     |    dim_magnitude_band     |
|-----------------------|     |-------------------------------|     |---------------------------|
| * region_id (PK)      |1   *| * event_id (PK)               |*   1| * magnitude_band (PK)     |
|   region_name         +-----+   date_str (FK)               +-----+   lower_bound             |
|   tectonic_setting    |     |   region_id (FK)              |     |   upper_bound             |
|   hazard_level        |     |   magnitude_band (FK)         |     |   severity_order          |
+-----------------------+     |   depth_band (FK)             |     +---------------------------+
                              |   magnitude, depth_km         |
                              |   longitude, latitude         |
                              |   tsunami, significance       |
                              +---------------+---------------+
                                              | *
                                              |
                                              | 1
                               +--------------+----------------+
                               |        dim_depth_band         |
                               |-------------------------------|
                               | * depth_band (PK)             |
                               |   min_depth_km, max_depth_km  |
                               |   tectonic_context            |
                               +-------------------------------+
```

---

## 2. Relational Tables in `powerbi/exports/`
| Table Name | Type | Records | Primary Key / Foreign Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`fact_earthquakes.csv`** | Fact | **26,170** | `event_id` | Granular USGS seismic events with magnitude, focal depth, coordinates, and tsunami indicators. |
| **`dim_date.csv`** | Dimension | **8,232** | `date_str` | Complete calendar dimension with year, month, quarter, and day-of-week attributes. |
| **`dim_region.csv`** | Dimension | **10** | `region_id` | Standardized tectonic regimes with boundary coordinates and hazard tiers. |
| **`dim_magnitude_band.csv`** | Dimension | **6** | `magnitude_band` | Seismological classification (Minor to Great). |
| **`dim_depth_band.csv`** | Dimension | **3** | `depth_band` | Lithospheric depth regimes (Shallow, Intermediate, Deep). |
| **`agg_monthly_seismic.csv`** | Aggregated Fact | **2,837** | `year_month_region` | Precomputed monthly aggregates from MongoDB `$group`. |
| **`agg_hotspot_cells.csv`** | Spatial Fact | **919** | `grid_id` | 2-degree geographic grid cells for concentration heatmapping. |

---

## 3. Power BI Report Pages

### Page 1: Global Seismic Overview
- **Header KPI Cards**:
  - `Total Earthquakes`: **26,170**
  - `Average Magnitude`: **M 5.56**
  - `Max Magnitude`: **M 9.1** (2011 Tohoku Megathrust / 2004 Sumatra)
  - `Average Depth`: **60.41 km**
  - `Tsunami Warnings Issued`: **824**
- **Annual Seismic Volume Trend**: Area chart (2000–2025) detailing annual frequency stability and aftershock peaks.
- **Magnitude Distribution**: Horizontal bar chart classified into Minor, Light, Moderate, Strong, Major, and Great bands.
- **Slicers**: Year Range, Tectonic Region, Tsunami Warning Indicator.

### Page 2: Geographic Distribution
- **Global Seismic Epicenter Map**: Point/Bubble map colored by Tectonic Region and sized by Magnitude.
- **Regional Volume Comparison**: Column chart ranking total events by region (Pacific Ring of Fire East Asia leading with 7,000+ events).
- **Mean Focal Depth by Region**: Column chart demonstrating deep subduction zones (Oceania & South Pacific averaging 160+ km) vs. shallow crustal zones (Mid-Atlantic Ridge averaging 11 km).
- **Highest Magnitude Registered by Region**: Comparative bar visual.

### Page 3: Magnitude and Temporal Analysis
- **Magnitude vs. Depth Scatter Plot**: 2D scatter matrix displaying focal depths (0 to 700 km) against magnitude scales.
- **Monthly Seasonality**: 12-month cyclical line chart verifying that seismic rupture is independent of calendar season.
- **Regional Magnitude Breakdown**: Stacked bar visual showing the proportion of Major (M7.0+) quakes across plate boundaries.
- **Slicers**: Depth Regime, Magnitude Category.

---

## 4. DAX Measures Specification
The following production-ready DAX formulas should be pasted into Power BI Desktop:

```dax
// 1. Total Earthquake Count
Total Earthquakes = COUNTROWS('fact_earthquakes')

// 2. Average Earthquake Magnitude
Average Magnitude = AVERAGE('fact_earthquakes'[magnitude])

// 3. Maximum Recorded Magnitude
Maximum Magnitude = MAX('fact_earthquakes'[magnitude])

// 4. Average Focal Depth in Kilometers
Average Depth (km) = AVERAGE('fact_earthquakes'[depth_km])

// 5. Total Tsunami Warnings Issued
Tsunami Alerts = SUM('fact_earthquakes'[tsunami])

// 6. Major Earthquake Ratio (M >= 7.0)
Major Quake Ratio = 
DIVIDE(
    CALCULATE(COUNTROWS('fact_earthquakes'), 'fact_earthquakes'[magnitude] >= 7.0),
    [Total Earthquakes],
    0
)

// 7. Shallow Earthquake Percentage (Depth <= 70km)
Shallow Quake Pct = 
DIVIDE(
    CALCULATE(COUNTROWS('fact_earthquakes'), 'fact_earthquakes'[depth_km] <= 70.0),
    [Total Earthquakes],
    0
)

// 8. Tectonic Hazard Severity Score
Hazard Severity Index = 
VAR EventVol = [Total Earthquakes]
VAR MaxMag = [Maximum Magnitude]
VAR TsunamiCount = [Tsunami Alerts]
RETURN
ROUND( (MaxMag * 10) + (EventVol / 500) + (TsunamiCount * 0.5), 1 )
```

---

## 5. Verification & Data Reconciliation Audit
Power BI data integrity was cross-reconciled against native MongoDB aggregations:

- **MongoDB `earthquakes` document count**: **26,170**
- **Power BI `fact_earthquakes` rows**: **26,170**
- **Discrepancy**: **0 (Zero Records Discrepancy, 100% Reconciled)**
- **Audit Timestamp**: `2026-10-31T18:22:01.424718Z`

---

## 6. How to Open and Refresh in Power BI Desktop
1. Launch **Power BI Desktop** on Windows.
2. Open `powerbi/EarthPulse_Report.pbix` or select **Get Data -> Text/CSV** and point to `powerbi/exports/fact_earthquakes.csv`.
3. Load the corresponding dimension files from `powerbi/exports/` (`dim_date.csv`, `dim_region.csv`, etc.).
4. Under the **Model View**, link the foreign keys:
   - `fact_earthquakes[date_str]` -> `dim_date[date_str]` (Many-to-One)
   - `fact_earthquakes[region_id]` -> `dim_region[region_id]` (Many-to-One)
   - `fact_earthquakes[magnitude_band]` -> `dim_magnitude_band[magnitude_band]` (Many-to-One)
5. To refresh data following a new ingestion, click **Home -> Refresh**.
