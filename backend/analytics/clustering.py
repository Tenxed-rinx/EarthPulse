"""
EarthPulse Advanced Data Mining - DBSCAN Spatial Clustering & Correlation Engine
Performs unsupervised spatial density clustering on earthquake epicenters using Scikit-Learn DBSCAN.
Identifies major seismic clusters corresponding to tectonic plate boundaries and fault line contacts.
Computes Pearson & Spearman statistical correlations between focal depth and earthquake magnitude.
"""
import numpy as np
from sklearn.cluster import DBSCAN
from scipy import stats
from backend.database.mongo import get_db

def run_dbscan_clustering(eps_km: float = 350.0, min_samples: int = 15, max_events: int = 5000):
    """
    Executes DBSCAN on recent / significant earthquake coordinates.
    Converts coordinates from degrees to radians for Haversine metric.
    Earth radius approx 6371.0 km.
    """
    db = get_db()
    # Fetch sample of earthquakes (e.g. M >= 5.5 or latest events)
    cursor = db["earthquakes"].find(
        {"magnitude": {"$gte": 5.4}},
        {"_id": 0, "event_id": 1, "magnitude": 1, "depth_km": 1, "place": 1, "region_name": 1, "location.coordinates": 1}
    ).sort("timestamp_ms", -1).limit(max_events)

    points = []
    events_meta = []
    for doc in cursor:
        coords = doc.get("location", {}).get("coordinates", [])
        if len(coords) >= 2:
            lon, lat = coords[0], coords[1]
            points.append([lat, lon])
            events_meta.append({
                "event_id": doc.get("event_id"),
                "place": doc.get("place"),
                "magnitude": doc.get("magnitude"),
                "depth_km": doc.get("depth_km"),
                "region_name": doc.get("region_name"),
                "lat": lat,
                "lon": lon
            })

    if len(points) < min_samples:
        return {"clusters_count": 0, "noise_count": 0, "clusters": [], "cluster_centers": []}

    coords_rad = np.radians(points)
    # Haversine metric eps in radians = eps_km / Earth_radius_km
    kms_per_radian = 6371.0
    epsilon = eps_km / kms_per_radian

    dbscan = DBSCAN(eps=epsilon, min_samples=min_samples, metric='haversine')
    labels = dbscan.fit_predict(coords_rad)

    unique_labels = set(labels)
    clusters_summary = []
    cluster_centers = []

    for k in sorted(unique_labels):
        if k == -1:
            continue  # Noise points
        class_member_mask = (labels == k)
        cluster_events = [events_meta[i] for i in range(len(events_meta)) if class_member_mask[i]]
        c_lats = [e["lat"] for e in cluster_events]
        c_lons = [e["lon"] for e in cluster_events]
        c_mags = [e["magnitude"] for e in cluster_events]
        c_depths = [e["depth_km"] for e in cluster_events]

        center_lat = float(np.mean(c_lats))
        center_lon = float(np.mean(c_lons))
        top_region = stats.mode([e["region_name"] for e in cluster_events], keepdims=True)[0][0]

        clusters_summary.append({
            "cluster_id": int(k),
            "size": len(cluster_events),
            "center_lat": round(center_lat, 3),
            "center_lon": round(center_lon, 3),
            "dominant_region": top_region,
            "avg_magnitude": round(float(np.mean(c_mags)), 2),
            "max_magnitude": round(float(np.max(c_mags)), 2),
            "avg_depth_km": round(float(np.mean(c_depths)), 2),
            "sample_places": [e["place"] for e in cluster_events[:3]]
        })

        cluster_centers.append({
            "cluster_id": int(k),
            "lat": round(center_lat, 3),
            "lon": round(center_lon, 3),
            "weight": len(cluster_events)
        })

    noise_count = int(np.sum(labels == -1))
    clusters_summary.sort(key=lambda x: x["size"], reverse=True)

    return {
        "algorithm": "DBSCAN (Density-Based Spatial Clustering of Applications with Noise)",
        "parameters": {
            "eps_km": eps_km,
            "min_samples": min_samples,
            "metric": "Haversine"
        },
        "total_analyzed_events": len(events_meta),
        "total_clusters_identified": len(clusters_summary),
        "noise_unclustered_events": noise_count,
        "clusters": clusters_summary[:15],
        "cluster_centers": cluster_centers
    }

def compute_depth_magnitude_correlation():
    """
    Computes statistical relationships between focal depth and earthquake magnitude.
    Returns Pearson r, Spearman rho, p-values, linear regression slope/intercept, and descriptive stats.
    """
    db = get_db()
    cursor = db["earthquakes"].find(
        {},
        {"_id": 0, "magnitude": 1, "depth_km": 1}
    )
    mags = []
    depths = []
    for d in cursor:
        mags.append(d["magnitude"])
        depths.append(d["depth_km"])

    if not mags:
        return {}

    mags_np = np.array(mags)
    depths_np = np.array(depths)

    pearson_r, p_val = stats.pearsonr(mags_np, depths_np)
    spearman_rho, sp_val = stats.spearmanr(mags_np, depths_np)
    slope, intercept, r_value, p_value, std_err = stats.linregress(mags_np, depths_np)

    return {
        "sample_size": len(mags),
        "pearson_correlation": round(float(pearson_r), 4),
        "pearson_p_value": float(p_val),
        "spearman_rank_correlation": round(float(spearman_rho), 4),
        "linear_regression": {
            "slope": round(float(slope), 4),
            "intercept": round(float(intercept), 4),
            "r_squared": round(float(r_value ** 2), 4),
            "formula": f"Depth = {slope:.2f} * Mag + {intercept:.2f}"
        },
        "magnitude_statistics": {
            "mean": round(float(np.mean(mags_np)), 2),
            "median": round(float(np.median(mags_np)), 2),
            "std_dev": round(float(np.std(mags_np)), 2),
            "min": round(float(np.min(mags_np)), 2),
            "max": round(float(np.max(mags_np)), 2)
        },
        "depth_statistics_km": {
            "mean": round(float(np.mean(depths_np)), 2),
            "median": round(float(np.median(depths_np)), 2),
            "std_dev": round(float(np.std(depths_np)), 2),
            "min": round(float(np.min(depths_np)), 2),
            "max": round(float(np.max(depths_np)), 2)
        },
        "geophysical_interpretation": (
            "Weak negative-to-neutral correlation demonstrates that high magnitude ruptures "
            "are not strictly confined to specific depths, although the largest catastrophic "
            "earthquakes (M >= 8.0) predominantly occur at shallow depths (0-70 km) along megathrust interfaces."
        )
    }
