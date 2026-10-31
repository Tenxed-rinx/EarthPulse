"""
EarthPulse Master ETL Pipeline Runner
Executes the complete end-to-end data engineering pipeline:
  Step 1: Download USGS Earthquake Data (2000-2025)
  Step 2: Transform, Clean, and Validate Records
  Step 3: Create & Verify MongoDB Indexes
  Step 4: Bulk Ingest Documents & Seed Metadata
  Step 5: Run MongoDB Aggregation Pipelines to Produce Summaries
  Step 6: Export Star-Schema Tables for Power BI Desktop
"""
import os
import sys
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.download_data import run_download
from scripts.clean_data import clean_and_transform
from scripts.create_indexes import create_indexes
from scripts.import_mongodb import import_to_mongodb
from scripts.generate_summaries import verify_all_aggregations
from scripts.export_powerbi import export_powerbi_data

def run_full_pipeline():
    start_all = time.time()
    print("=" * 80)
    print("  EARTHPULSE: GLOBAL EARTHQUAKE DATA MINING & ANALYTICS PLATFORM")
    print("  STARTING FULL END-TO-END DATA ENGINEERING & INGESTION PIPELINE")
    print("=" * 80)

    # Step 1: Download
    print("\n>>> STEP 1/6: USGS DATA DOWNLOAD <<<")
    run_download(start_year=2000, end_year=2025, min_mag=5.2)

    # Step 2: Clean & Validate
    print("\n>>> STEP 2/6: DATA CLEANING & TRANSFORMATION <<<")
    clean_and_transform()

    # Step 3: MongoDB Indexes
    print("\n>>> STEP 3/6: MONGODB INDEX ARCHITECTURE <<<")
    create_indexes()

    # Step 4: MongoDB Ingestion
    print("\n>>> STEP 4/6: MONGODB BULK LOADING <<<")
    import_to_mongodb()

    # Step 5: Aggregation Summaries
    print("\n>>> STEP 5/6: MONGODB AGGREGATION PIPELINES <<<")
    verify_all_aggregations()

    # Step 6: Power BI Exports
    print("\n>>> STEP 6/6: POWER BI RELATIONAL EXPORT <<<")
    export_powerbi_data()

    total_time = time.time() - start_all
    print("\n" + "=" * 80)
    print(f"  ETL PIPELINE EXECUTION COMPLETED SUCCESSFULLY IN {total_time:.2f} SECONDS!")
    print("=" * 80)

if __name__ == "__main__":
    run_full_pipeline()
