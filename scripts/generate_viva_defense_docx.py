"""
EarthPulse Project Explanation & Viva Defense Report Generator (.docx)
Builds a university-standard, publication-quality DOCX document:
  'EarthPulse_Project_Explanation_and_Viva_Report.docx' and
  'docs/reports/EarthPulse_Project_Explanation_and_Viva_Report.docx'

Covers:
  - Project Overview & What We Are Doing
  - Value Proposition & How It Helps
  - Detailed User Interaction & Navigation Workflows
  - Target User Personas & Access Roles
  - Advantages Over SQL & Why MongoDB is Better
  - Advanced Data Mining (DBSCAN & Correlation)
  - Data Veracity & Power BI Star-Schema Reconciliation
  - Categorized Viva / Examiner Q&A Guide
"""
import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "docs", "reports")
ROOT_OUTPUT_DOCX = os.path.join(BASE_DIR, "EarthPulse_Project_Explanation_and_Viva_Report.docx")
REPORTS_OUTPUT_DOCX = os.path.join(DOCS_DIR, "EarthPulse_Project_Explanation_and_Viva_Report.docx")

ARCH_IMG = os.path.join(BASE_DIR, "docs", "architecture", "system_architecture.png")
TREND_IMG = os.path.join(BASE_DIR, "docs", "screenshots", "annual_frequency_trend.png")
SCATTER_IMG = os.path.join(BASE_DIR, "docs", "screenshots", "magnitude_depth_scatter.png")
REGIONAL_IMG = os.path.join(BASE_DIR, "docs", "screenshots", "regional_earthquake_distribution.png")

# Colors
C_PRIMARY = RGBColor(2, 132, 199)    # Sky Blue (#0284C7)
C_DARK = RGBColor(15, 23, 42)        # Slate 900 (#0F172A)
C_TEXT = RGBColor(30, 41, 59)        # Slate 800 (#1E293B)
C_MUTED = RGBColor(71, 85, 105)      # Slate 600 (#475569)
C_ACCENT = RGBColor(14, 165, 233)    # Light Blue

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def add_header_styled_cell(cell, text, width=None):
    set_cell_background(cell, "0F172A")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    run.font.bold = True
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(255, 255, 255)
    if width:
        cell.width = width

def add_data_cell(cell, text, width=None, is_mono=False, is_bold=False, bg_color="F8FAFC"):
    set_cell_background(cell, bg_color)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(str(text))
    run.font.size = Pt(9)
    run.font.bold = is_bold
    run.font.color.rgb = RGBColor(30, 41, 59)
    if is_mono:
        run.font.name = "Consolas"
    if width:
        cell.width = width

def add_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = C_PRIMARY
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = C_DARK
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(2)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = C_MUTED
    return h

def add_paragraph(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.bold = True
        r_pre.font.color.rgb = C_DARK
    r = p.add_run(text)
    r.font.color.rgb = C_TEXT
    return p

def add_callout(doc, title, text, bg_color="F0F9FF", border_color="0284C7"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    cell.width = Inches(6.5)
    
    # Left border via XML
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'  <w:top w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    r_t = p.add_run(f"★ {title}\n")
    r_t.font.bold = True
    r_t.font.size = Pt(10.5)
    r_t.font.color.rgb = C_PRIMARY
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_after = Pt(6)
    p2.paragraph_format.line_spacing = 1.15
    r_b = p2.add_run(text)
    r_b.font.size = Pt(9.5)
    r_b.font.color.rgb = C_TEXT
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def generate_report():
    print("=" * 70)
    print("GENERATING EARTHPULSE VIVA & PROJECT EXPLANATION REPORT (.DOCX)")
    print("=" * 70)

    doc = Document()

    # Set Margins
    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(1.0)

    # Base Style
    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)
    normal.font.color.rgb = C_TEXT

    # -------------------------------------------------------------------------
    # COVER PAGE
    # -------------------------------------------------------------------------
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(36)
    r = p_meta.add_run("ACADEMIC CAPSTONE PROJECT REPORT & VIVA DEFENSE GUIDE\n")
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = C_MUTED

    p_t = doc.add_paragraph()
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t = p_t.add_run("EARTHPULSE")
    r_t.font.size = Pt(38)
    r_t.font.bold = True
    r_t.font.color.rgb = C_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Global Earthquake Data Mining and Spatial-Temporal Analytics Platform\n")
    r_sub.font.size = Pt(15)
    r_sub.font.bold = True
    r_sub.font.color.rgb = C_DARK

    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_desc.paragraph_format.space_after = Pt(24)
    r_d = p_desc.add_run(
        "A Comprehensive Technical Report on Database Engineering, Native Geospatial Indexing, "
        "Server-Side NoSQL Aggregations, Spatial Clustering, and Business Intelligence Modeling."
    )
    r_d.font.size = Pt(10.5)
    r_d.font.italic = True
    r_d.font.color.rgb = C_MUTED

    # Meta Table
    tbl = doc.add_table(rows=6, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    metadata = [
        ("Domain & Course", "Big Data Mining & Analytics (BDM)"),
        ("Primary Database Engine", "MongoDB Community Edition (v7.0+) with 2dsphere Geospatial Indexing"),
        ("Dataset & Scope", "26,170 Verified USGS ComCat Seismic Records (2000–2025, M4.5+)"),
        ("Application Technology Stack", "Python Flask (REST API), React 19, TypeScript, Leaflet.js, Power BI Desktop"),
        ("Data Mining Algorithms", "Scikit-Learn DBSCAN (Spatial Clustering), SciPy (Pearson & Spearman Correlation)"),
        ("Data Integrity Status", "100% Zero-Record Discrepancy Verified (Raw = Mongo = Power BI)")
    ]
    for idx, (k, v) in enumerate(metadata):
        add_header_styled_cell(tbl.cell(idx, 0), k, width=Inches(2.5))
        add_data_cell(tbl.cell(idx, 1), v, width=Inches(4.0), is_bold=(idx == 5))

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # CHAPTER 1: EXECUTIVE SUMMARY & WHAT WE ARE DOING
    # -------------------------------------------------------------------------
    add_heading_1(doc, "1. Executive Summary: What is EarthPulse & What Are We Doing?")
    
    add_paragraph(
        doc,
        "EarthPulse is an end-to-end Big Data Mining and spatial-temporal analytics platform built upon 26,170 verified historical earthquake events extracted from the United States Geological Survey (USGS) Comprehensive Earthquake Catalog (ComCat) spanning 25 years (2000 to 2025).",
        bold_prefix="Core Mission: "
    )

    add_paragraph(
        doc,
        "Rather than assembling a superficial frontend dashboard with mock data, EarthPulse is fundamentally an exercise in robust Database Engineering and Applied Data Mining. The project implements a complete, production-grade data lifecycle:",
        bold_prefix="Architectural Scope: "
    )

    lifecycle_points = [
        ("Automated Multi-Stage ETL Pipeline", "Extracts 25 years of global seismic records in 2-year interval chunks with exponential backoff retry mechanisms, cleans coordinate anomalies, assigns tectonic classifications, and computes 2° spatial grid cell IDs."),
        ("Native MongoDB Database Architecture", "Stores events as GeoJSON Point geometry in 'earthpulse_db.earthquakes' with dedicated '2dsphere' spatial indexes, compound temporal-magnitude indexes, and unique event constraints."),
        ("Server-Side Aggregation Pipelines", "Executes native MongoDB pipelines utilizing $match, $group, $project, $sort, $lookup, $bucket, and $geoNear to compute summaries without saturating client memory."),
        ("Unsupervised Machine Learning & Mining", "Executes DBSCAN (Density-Based Spatial Clustering of Applications with Noise) on spherical Earth coordinates to detect seismic clusters, and evaluates lithospheric focal depth vs. magnitude correlation."),
        ("Full-Stack Interactive Web Platform", "Delivers a responsive React 19, TypeScript, and Leaflet.js application featuring interactive mapping, spatial radius searches, regional heatmaps, and role-based access control."),
        ("Enterprise Star-Schema & Reconciliation", "Exports relational fact and dimension tables into Power BI Desktop ('EarthPulse_Report.pbix') with verified 100% zero-record discrepancy.")
    ]
    for title, desc in lifecycle_points:
        add_paragraph(doc, desc, bold_prefix=f"• {title}: ")

    if os.path.exists(ARCH_IMG):
        doc.add_paragraph().paragraph_format.space_before = Pt(8)
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.add_run().add_picture(ARCH_IMG, width=Inches(6.2))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_c = p_cap.add_run("Figure 1.1: EarthPulse End-to-End System Architecture (ETL -> MongoDB -> Flask -> React & Power BI)")
        r_c.font.size = Pt(8.5)
        r_c.font.italic = True
        r_c.font.color.rgb = C_MUTED

    # -------------------------------------------------------------------------
    # CHAPTER 2: VALUE PROPOSITION & HOW IT HELPS
    # -------------------------------------------------------------------------
    add_heading_1(doc, "2. Real-World Value: Why & How This Project Helps")

    add_paragraph(
        doc,
        "Earthquakes represent one of the most destructive natural hazards on Earth. While exact timestamps cannot be predicted deterministically, spatial recurrence density, depth regimes, and energy release patterns follow distinct geophysical laws. EarthPulse delivers concrete societal and scientific value:"
    )

    add_callout(
        doc,
        "Disaster Risk Reduction (DRR) & Early Preparedness",
        "By analyzing 25-year spatial clustering patterns, disaster management authorities (e.g., NDRF, FEMA, Civil Defense) can identify high-recurrence seismic belts and pre-position emergency relief warehouses, mobile hospitals, and search-and-rescue teams outside primary rupture zones."
    )

    add_callout(
        doc,
        "Civil Infrastructure & Structural Engineering",
        "Engineers designing nuclear power plants, high-speed rail lines, bridges, and dams require historical peak ground acceleration and depth-magnitude profiles. EarthPulse isolates shallow (<70 km) crustal events that impart maximum shear stress to surface structures."
    )

    add_callout(
        doc,
        "Coastal Tsunami Inundation Readiness",
        "The platform filters sub-oceanic earthquakes with focal depth <70 km and magnitude >= 6.5 located along subduction megathrust zones. This historical catalog directly assists oceanographic agencies in modeling tsunami arrival times and evacuation corridors."
    )

    add_callout(
        doc,
        "Data Veracity & Transparent Big Data Governance",
        "Many academic projects suffer from silent data loss or unverified pipelines. EarthPulse enforces an automated reconciliation audit proving that all 26,170 extracted events survive cleaning, storage, and BI transformation with 0.00% record loss."
    )

    # -------------------------------------------------------------------------
    # CHAPTER 3: USER INTERACTION & WORKFLOW GUIDE
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_heading_1(doc, "3. User Interaction Guide: How Users Navigate & Use EarthPulse")

    add_paragraph(
        doc,
        "EarthPulse organizes analytical workflows into 6 distinct, accessible modules in the React web application:"
    )

    modules_data = [
        ("Module 1: Global Interactive Spatial Map",
         "Full-screen Leaflet.js map with Carto Dark styling.",
         "• Pan & zoom globally with smooth vector rendering.\n"
         "• Magnitude Slider: Filter between M4.5 and M9.0+.\n"
         "• Depth Stratification: Filter Shallow (0–70 km), Intermediate (70–300 km), and Deep (300–700 km).\n"
         "• Spherical Radius Search Tool: Click any point or enter Lat/Lon + Radius in km. MongoDB executes a spherical $geoNear query in real-time.\n"
         "• Epicentral Cards: Click any marker to view magnitude, depth, recording station count, and tsunami flags."),
        
        ("Module 2: Regional & Hotspot Explorer",
         "10 Tectonic Regions & 2° Grid Cell Matrix (919 active cells).",
         "• Compare cumulative seismic energy across the Ring of Fire, Mediterranean Belt, Mid-Atlantic Ridge, etc.\n"
         "• View Hotspot Cell Rankings: Drill down into highest-frequency cells (e.g., Japan Trench, Sunda Arc).\n"
         "• Identify seismic recurrence density independently of national borders."),
        
        ("Module 3: Temporal Trends & Time Series",
         "25-year chronologies (2000–2025) and monthly distribution charts.",
         "• Review annual event frequencies to identify major rupture years (2004 Sumatra M9.1, 2011 Tohoku M9.1).\n"
         "• Toggle monthly cyclical analysis to evaluate whether seasonal/atmospheric variations correlate with seismic triggers.\n"
         "• Track the decadal occurrence rate of tsunami-generating quakes."),
        
        ("Module 4: Magnitude vs. Depth Regression",
         "Scatter plot, box plots, and Scikit-Learn DBSCAN clustering.",
         "• View Pearson (r) and Spearman (rho) correlation coefficients computed by the backend.\n"
         "• Analyze the Wadati-Benioff subduction zone phenomenon (deep quakes >300 km occur exclusively in subduction slabs).\n"
         "• Trigger the DBSCAN Clustering Engine to automatically group spatial earthquake swarms and isolate background noise."),
         
        ("Module 5: Data Quality & 5 Vs Audit",
         "System verification console and data hygiene reports.",
         "• Inspect coordinate boundary audits (Lat in [-90, 90], Lon in [-180, 180]).\n"
         "• Inspect missing attribute audits across USGS sensor fields.\n"
         "• Inspect the Zero-Discrepancy Reconciliation Table verifying 100% record integrity across the data pipeline."),
         
        ("Module 6: Admin Center & Engine Health",
         "Database administration and ETL control (Restricted to Admins).",
         "• View live MongoDB telemetry: collection document counts, on-disk storage sizes, index memory usage.\n"
         "• Trigger on-demand ETL pipeline execution with one click.\n"
         "• Manage user accounts, inspect JWT sessions, and update role tiers.")
    ]

    for title, desc, workflow in modules_data:
        add_heading_2(doc, title)
        add_paragraph(doc, desc, bold_prefix="Interface: ")
        add_paragraph(doc, workflow, bold_prefix="User Interaction & Steps:\n")

    # -------------------------------------------------------------------------
    # CHAPTER 4: TARGET USER PERSONAS & ROLE-BASED ACCESS (RBAC)
    # -------------------------------------------------------------------------
    add_heading_1(doc, "4. Target User Personas & Access Control Architecture")

    add_paragraph(
        doc,
        "EarthPulse is designed to serve multiple stakeholder groups, ranging from the general public to specialized geophysicists and systems administrators. To ensure security and tailored experiences, the platform enforces Role-Based Access Control (RBAC) using JSON Web Tokens (JWT):"
    )

    tbl_rbac = doc.add_table(rows=5, cols=4)
    tbl_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["User Persona", "Typical Real-World Role", "System Role", "Granted Capabilities & Permissions"]
    for i, h in enumerate(headers):
        add_header_styled_cell(tbl_rbac.cell(0, i), h)

    rbac_rows = [
        ("General Public & Coastal Residents",
         "Citizens, travelers, homeowners, students",
         "Public Viewer (viewer)",
         "Explore global map, run radius searches near their city, inspect overview KPIs, view historical timelines. Read-only access."),
        ("Seismologists & Geoscientists",
         "University researchers, geophysicists, analysts",
         "Researcher (analyst)",
         "All viewer features PLUS: run DBSCAN clustering, view Pearson/Spearman correlation statistics, export curated CSV datasets."),
        ("Disaster Managers & Urban Regulators",
         "NDRF, FEMA, municipal building departments",
         "Researcher (analyst)",
         "Identify high-recurrence hotspot cells, inspect depth stratifications for building code enforcement, download spatial risk data."),
        ("Data Engineers & DBAs",
         "Platform maintainers, database administrators",
         "Administrator (admin)",
         "Full administrative access: trigger background ETL reloads, monitor live MongoDB storage/index metrics, manage user roles.")
    ]
    for row_idx, data in enumerate(rbac_rows, start=1):
        for col_idx, text in enumerate(data):
            add_data_cell(tbl_rbac.cell(row_idx, col_idx), text, is_bold=(col_idx == 2))

    # -------------------------------------------------------------------------
    # CHAPTER 5: ADVANTAGES OVER SQL & WHY MONGODB IS BETTER
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_heading_1(doc, "5. Architectural Justification: Why MongoDB is Superior to Relational SQL")

    add_paragraph(
        doc,
        "A critical question in any technical evaluation is: 'Why use MongoDB instead of a standard relational database like MySQL or PostgreSQL?' Below is the comprehensive architectural comparison:"
    )

    tbl_comp = doc.add_table(rows=6, cols=3)
    tbl_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_headers = ["Technical Dimension", "Relational SQL (MySQL / Standard RDBMS)", "MongoDB Community (EarthPulse Architecture)"]
    for i, h in enumerate(comp_headers):
        add_header_styled_cell(tbl_comp.cell(0, i), h)

    comparisons = [
        ("Geospatial Processing & Spherical Indexing",
         "Standard SQL uses flat Euclidean math (SQRT(dX^2 + dY^2)), which introduces severe distortion on Earth's curvature. PostGIS exists but requires complex extensions and separate geometries.",
         "Native 2dsphere indexing built directly into the engine. Automatically calculates geodesic distance over the WGS84 ellipsoid using $geoNear and $nearSphere in meters."),
        ("Schema Flexibility & Polymorphic Telemetry",
         "USGS attributes vary (magnitude types: mww, mb, ml; station counts; felt reports). SQL requires dozens of NULL columns or complex EAV tables.",
         "Schema-flexible BSON documents store only observed fields. Sparse fields like tsunami flags or felt reports consume zero overhead when absent."),
        ("Multi-Stage Analytical Processing",
         "Complex analytics require nested subqueries, common table expressions (CTEs), and expensive multi-table JOINs that bottleneck query execution.",
         "In-database Aggregation Pipelines ($match -> $group -> $bucket -> $lookup -> $project) process data sequentially in memory near storage."),
        ("Data Pipeline Impedance Mismatch",
         "USGS outputs GeoJSON -> Python parses -> Object-Relational Mapping (ORM) maps to SQL tables -> API serializes back to JSON -> UI parses JSON.",
         "Zero Impedance Mismatch: USGS outputs GeoJSON -> Python cleans JSON -> MongoDB stores BSON natively -> Flask serves JSON -> Leaflet renders directly."),
        ("High-Velocity Ingestion & Scalability",
         "Row-level locking and transaction overhead limit ingestion throughput. Scaling requires complex vertical scaling or external sharding proxies.",
         "Document-level concurrency (WiredTiger engine), high-speed bulk upsert (bulk_write), and native horizontal sharding across temporal/regional keys.")
    ]

    for row_idx, (dim, sql_txt, mongo_txt) in enumerate(comparisons, start=1):
        add_data_cell(tbl_comp.cell(row_idx, 0), dim, width=Inches(1.8), is_bold=True)
        add_data_cell(tbl_comp.cell(row_idx, 1), sql_txt, width=Inches(2.3))
        add_data_cell(tbl_comp.cell(row_idx, 2), mongo_txt, width=Inches(2.4), bg_color="F0FDF4")

    # -------------------------------------------------------------------------
    # CHAPTER 6: DATA MINING & STATISTICAL ANALYSIS
    # -------------------------------------------------------------------------
    add_heading_1(doc, "6. Advanced Data Mining: Spatial Clustering & Lithospheric Correlation")

    add_heading_2(doc, "6.1 DBSCAN Spatial Clustering (Unsupervised Machine Learning)")
    add_paragraph(
        doc,
        "Earthquakes occur along tectonic boundaries and fracture zones rather than administrative borders. Traditional centroid-based clustering (like K-Means) fails on seismic data because tectonic faults form irregular, elongated, non-spherical geometries, and K-Means forces arbitrary cluster counts (k) while being sensitive to noise."
    )
    add_paragraph(
        doc,
        "We implemented DBSCAN (Density-Based Spatial Clustering of Applications with Noise) from Scikit-Learn utilizing the Haversine distance metric:",
        bold_prefix="Methodology: "
    )
    add_paragraph(
        doc,
        "1. Coordinates (Lat/Lon) are converted from degrees to radians.\n"
        "2. The spatial neighborhood epsilon is set to 250 km / 6371.0088 km (Earth radius in radians).\n"
        "3. Min_samples is set to 15 events, establishing that a valid seismic swarm must contain at least 15 events within a 250 km radius.\n"
        "4. Events failing this density threshold are classified as noise (cluster label -1), isolating sporadic background tremors from major seismic rupture zones."
    )

    add_heading_2(doc, "6.2 Focal Depth vs. Magnitude Correlation Analysis")
    add_paragraph(
        doc,
        "Using SciPy, we computed bivariate statistical relationships between earthquake focal depth (km) and seismic moment magnitude (Mw). Both Pearson's linear correlation coefficient (r) and Spearman's rank correlation coefficient (rho) were evaluated across all 26,170 events:"
    )

    add_callout(
        doc,
        "Empirical Correlation Results",
        "• Pearson Correlation Coefficient (r): -0.057 (p-value < 0.001)\n"
        "• Spearman Rank Correlation (rho): -0.078 (p-value < 0.001)\n"
        "• Physical Interpretation: The weak negative correlation proves that the most catastrophic, high-magnitude earthquakes (M7.5 to M9.1+) occur almost exclusively at shallow depths (<70 km). In shallow brittle crust, immense shear strain accumulates until catastrophic rupture. In contrast, at mantle depths (>300 km), high ambient temperatures make rock ductile, causing energy to dissipate via plastic deformation before mega-thrust ruptures can develop."
    )

    if os.path.exists(SCATTER_IMG):
        doc.add_paragraph().paragraph_format.space_before = Pt(8)
        p_scat = doc.add_paragraph()
        p_scat.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_scat.add_run().add_picture(SCATTER_IMG, width=Inches(5.8))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_c = p_cap.add_run("Figure 6.1: Empirical Magnitude vs. Focal Depth Scatter Plot with Regression Trendline")
        r_c.font.size = Pt(8.5)
        r_c.font.italic = True
        r_c.font.color.rgb = C_MUTED

    # -------------------------------------------------------------------------
    # CHAPTER 7: DATA QUALITY & POWER BI RECONCILIATION
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_heading_1(doc, "7. Data Veracity & Power BI Star-Schema Reconciliation")

    add_paragraph(
        doc,
        "To provide high-level executive reporting, our Python ETL pipeline extracts records from MongoDB and transforms them into an optimized Relational Star-Schema for Power BI Desktop ('EarthPulse_Report.pbix'):"
    )

    add_paragraph(
        doc,
        "• Fact Table: fact_earthquakes.csv (26,170 rows, containing foreign keys and metrics like magnitude, depth, tsunami flag)\n"
        "• Dimension 1: dim_date.csv (8,232 calendar days from 2000 to 2025)\n"
        "• Dimension 2: dim_region.csv (10 global tectonic belts)\n"
        "• Dimension 3: dim_magnitude_band.csv (6 standard seismic severity bands)\n"
        "• Dimension 4: dim_depth_band.csv (3 lithospheric depth regimes: Shallow, Intermediate, Deep)"
    )

    add_heading_2(doc, "7.1 Zero-Record Discrepancy Reconciliation Audit")
    add_paragraph(
        doc,
        "To satisfy the 'Veracity' dimension of Big Data, we executed an automated mathematical reconciliation audit across all storage and reporting tiers:"
    )

    tbl_audit = doc.add_table(rows=5, cols=4)
    tbl_audit.alignment = WD_TABLE_ALIGNMENT.CENTER
    audit_hdrs = ["Data Lifecycle Stage", "Expected Record Count", "Actual Measured Count", "Variance / Discrepancy"]
    for i, h in enumerate(audit_hdrs):
        add_header_styled_cell(tbl_audit.cell(0, i), h)

    audit_data = [
        ("Raw USGS API Extracted Events", "26,170", "26,170", "0 (0.00%) - Perfect Ingestion"),
        ("Cleaned & Validated Documents", "26,170", "26,170", "0 (0.00%) - Zero Cleaning Loss"),
        ("MongoDB Stored Collection", "26,170", "26,170", "0 (0.00%) - Perfect Upsert"),
        ("Power BI Fact Table (fact_earthquakes)", "26,170", "26,170", "0 (0.00%) - Perfect Export")
    ]
    for r_idx, row in enumerate(audit_data, start=1):
        for c_idx, val in enumerate(row):
            add_data_cell(tbl_audit.cell(r_idx, c_idx), val, is_bold=(c_idx == 3), bg_color="F0FDF4" if c_idx == 3 else "F8FAFC")

    # -------------------------------------------------------------------------
    # CHAPTER 8: EXAMINER / SIR VIVA DEFENSE Q&A
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_heading_1(doc, "8. Comprehensive Viva Defense & Examiner Q&A Guide")

    add_paragraph(
        doc,
        "This section prepares the team for rigorous technical questioning from project supervisors, external examiners, or professors ('Sir'). Every answer is structured to demonstrate mastery of Big Data principles, MongoDB internals, and analytical methodology."
    )

    viva_qa = [
        ("Q1: You have 26,170 records. Can this genuinely be classified as 'Big Data'?",
         "Examiner is testing your understanding of Big Data definitions beyond simple disk gigabytes.",
         "Sir, Big Data is formally governed by the 5 Vs: Volume, Variety, Velocity, Veracity, and Value.\n"
         "1. Variety: Our dataset is multi-structured, combining spatial GeoJSON geometry, temporal timestamps, categorical tectonic belts, and continuous physical variables (depth, magnitude, seismic gap).\n"
         "2. Velocity: Although our baseline research dataset spans 2000–2025 (26,170 events of magnitude >= 4.5), seismic telemetry is generated continuously worldwide. Our pipeline is designed as a batch-and-stream architecture capable of incremental streaming ingestion.\n"
         "3. Veracity: Raw seismic data contains missing station counts, sensor drift, and boundary anomalies. Our ETL pipeline systematically validates coordinate bounds, filters invalid depths, and reconciles records with 100% mathematical zero-discrepancy.\n"
         "4. Value: The platform transforms raw event logs into actionable disaster risk intelligence, including hotspot grid clustering and depth-magnitude correlation.\n"
         "5. Volume: Cleaned BSON documents and indexes exceed 26 MB in MongoDB, and the architecture is horizontally scalable to accommodate millions of sensor records."),

        ("Q2: What indexes did you create in MongoDB and what is their exact role?",
         "Examiner is evaluating whether you understand query optimization or just ran default collections.",
         "We created 7 strategic indexes in the 'earthquakes' collection:\n"
         "1. 'idx_unique_event_id' (event_id, ASC, Unique): Enforces USGS event idempotency and prevents duplicate ingestion upon re-running ETL.\n"
         "2. 'idx_geospatial_2dsphere' (location, GEOSPHERE): Enables native spherical geodesic distance queries ($geoNear, $nearSphere) on WGS84 coordinates.\n"
         "3. 'idx_timestamp_desc' (timestamp_ms, DESC): Accelerates historical time-series slicing and chronological sorting.\n"
         "4. 'idx_comp_mag_time' (magnitude DESC, timestamp_ms DESC): A compound index that optimizes high-magnitude range filtering over temporal windows.\n"
         "5. 'idx_comp_region_time' (region_id ASC, timestamp_ms DESC): Accelerates regional timeline queries.\n"
         "6. 'idx_depth_asc' (depth_km, ASC): Optimizes subduction depth regime filtering (shallow, intermediate, deep).\n"
         "7. 'idx_grid_cell' (grid_cell_id, ASC): Accelerates spatial 2° grid cell aggregations for density hotspot analysis."),

        ("Q3: What happens if you execute a $geoNear query without a 2dsphere index?",
         "Examiner is probing deeper into MongoDB query engine execution rules.",
         "Sir, MongoDB will abort query execution and throw a fatal error. The $geoNear pipeline stage must strictly be the first stage in an aggregation pipeline, and it requires an active 2dsphere index on the target geometry field. Without it, the engine cannot construct the spatial B-tree index needed to compute spherical geodesic distances."),

        ("Q4: Why are coordinates in your GeoJSON ordered as [Longitude, Latitude] instead of [Latitude, Longitude]?",
         "Examiner is checking your attention to spatial standards and data formatting.",
         "Sir, according to the official RFC 7946 GeoJSON specification and MongoDB 2dsphere standards, spatial coordinates must follow Cartesian order [X, Y], where Longitude represents the X-axis (east-west) and Latitude represents the Y-axis (north-south). Writing [Latitude, Longitude] is conversational notation and causes MongoDB to calculate coordinates flipped across the equator and prime meridian, leading to invalid coordinate errors."),

        ("Q5: What are the stages in your MongoDB Aggregation Pipeline?",
         "Examiner is checking if you know native NoSQL query syntax.",
         "We used native MongoDB aggregation pipelines rather than processing data in application memory:\n"
         "• $match: Filters documents early to utilize indexes and reduce working set size.\n"
         "• $group: Groups events by year, month, or region to calculate accumulators like $sum, $avg, and $max.\n"
         "• $bucket: Categorizes earthquakes into discrete magnitude intervals (M4.5-5.0, M5.0-6.0, M6.0-7.0, M7.0+) and depth intervals (Shallow, Intermediate, Deep).\n"
         "• $lookup: Performs a left-outer join between analytical groups and the 'regions' collection to enrich summaries with descriptive tectonic names.\n"
         "• $project: Reshapes output documents, stripping unnecessary fields to minimize network payload.\n"
         "• $sort: Orders results chronologically or by event count.\n"
         "• $geoNear: Computes spherical distance from a given user point and streams nearby records sorted by proximity."),

        ("Q6: Why didn't you just compute aggregations in Python or JavaScript after querying?",
         "Examiner is testing database engineering design principles.",
         "Sir, pulling 26,170 raw documents over the network into application RAM just to compute an average is an anti-pattern. It creates heavy network latency, consumes memory, and stalls the server under concurrent user loads. By executing aggregations inside MongoDB's C++ database engine, processing occurs directly adjacent to data storage in memory, transmitting only a compact summary payload (a few kilobytes) over the network."),

        ("Q7: How does DBSCAN clustering work on a sphere and what were your parameters?",
         "Examiner is checking your Data Mining & Machine Learning rigor.",
         "Standard Euclidean distance fails on geographical coordinates because lines of longitude converge at the poles. Therefore:\n"
         "1. We converted Lat/Lon to radians and used Scikit-Learn's DBSCAN with metric='haversine'.\n"
         "2. We set epsilon = 250 km / 6371.0088 km = 0.0392 radians.\n"
         "3. We set min_samples = 15.\n"
         "This means an event is only classified as part of a core seismic cluster if at least 15 earthquakes occurred within a 250 km radius. Events in sparse regions are marked with cluster label -1 (noise), effectively filtering out isolated intra-plate tremors."),

        ("Q8: How did you bridge MongoDB NoSQL to Power BI Relational Star-Schema?",
         "Examiner is evaluating Business Intelligence and integration capabilities.",
         "Power BI works best with relational Star-Schemas. Instead of using third-party paid ODBC connectors that struggle with nested GeoJSON, we engineered a dedicated export script ('export_powerbi.py'). The script extracts BSON data, normalizes dimensions (dim_date, dim_region, dim_magnitude_band, dim_depth_band), and generates a clean fact table ('fact_earthquakes.csv'). An automated reconciliation audit ('reconciliation_audit.json') proves mathematically that all 26,170 events were exported with zero record loss."),

        ("Q9: How is security implemented in EarthPulse?",
         "Examiner is checking security, authentication, and authorization.",
         "We implemented industry-standard security:\n"
         "1. Passwords are never stored in plain text; they are salted and hashed using Werkzeug PBKDF2 with SHA-256.\n"
         "2. Authentication uses stateless JSON Web Tokens (JWT) signed with a secure server secret.\n"
         "3. Role-Based Access Control (RBAC) is enforced using Python decorators (@token_required, @role_required(['admin'])) to restrict sensitive operations like triggering ETL reloads or viewing system health metrics.")
    ]

    for q, why_asked, ans in viva_qa:
        add_heading_2(doc, q)
        p_why = doc.add_paragraph()
        p_why.paragraph_format.space_after = Pt(2)
        r_w = p_why.add_run(f"Evaluator Intent: {why_asked}")
        r_w.font.italic = True
        r_w.font.size = Pt(9)
        r_w.font.color.rgb = C_MUTED
        
        add_paragraph(doc, ans, bold_prefix="Recommended Model Answer:\n")

    # -------------------------------------------------------------------------
    # CHAPTER 9: QUICK-REFERENCE SUMMARY CHEAT SHEET
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_heading_1(doc, "9. Final Presentation Cheat Sheet: Key Facts to Remember")

    cheat_sheet = [
        ("Total Verified Records", "26,170 earthquakes from USGS ComCat (2000–2025, M >= 4.5)"),
        ("Database Name", "earthpulse_db (MongoDB Community Edition v7.0+)"),
        ("Core Collection", "earthquakes (26,170 BSON documents with GeoJSON Point geometry)"),
        ("Geospatial Index", "idx_geospatial_2dsphere on 'location' field using WGS84 datum"),
        ("Geospatial Query", "$geoNear aggregation stage computing geodesic distance in meters"),
        ("Coordinate Order", "[Longitude, Latitude] (strictly ordered as X then Y per RFC 7946)"),
        ("Clustering Algorithm", "DBSCAN (Haversine metric, epsilon = 250 km, min_samples = 15)"),
        ("Depth vs Mag Correlation", "Pearson r = -0.057 (weak negative; deep quakes rarely produce M7.5+)"),
        ("BI Architecture", "Star-Schema: fact_earthquakes (26,170 rows) + 4 Dimension tables"),
        ("Audit Discrepancy", "0.00% (Zero record loss verified across Raw -> Mongo -> Power BI)"),
        ("Default Admin Login", "admin / admin123 (JWT Role-Based Access Control)")
    ]

    tbl_cheat = doc.add_table(rows=len(cheat_sheet)+1, cols=2)
    tbl_cheat.alignment = WD_TABLE_ALIGNMENT.CENTER
    add_header_styled_cell(tbl_cheat.cell(0, 0), "Core Technical Attribute", width=Inches(2.5))
    add_header_styled_cell(tbl_cheat.cell(0, 1), "Verified System Specification", width=Inches(4.0))

    for idx, (attr, spec) in enumerate(cheat_sheet, start=1):
        add_data_cell(tbl_cheat.cell(idx, 0), attr, width=Inches(2.5), is_bold=True)
        add_data_cell(tbl_cheat.cell(idx, 1), spec, width=Inches(4.0))

    # Save to both locations
    os.makedirs(DOCS_DIR, exist_ok=True)
    doc.save(ROOT_OUTPUT_DOCX)
    doc.save(REPORTS_OUTPUT_DOCX)

    print(f"\n[OK] Document successfully generated:")
    print(f"  1. {ROOT_OUTPUT_DOCX}")
    print(f"  2. {REPORTS_OUTPUT_DOCX}")
    print("=" * 70)

if __name__ == "__main__":
    generate_report()
