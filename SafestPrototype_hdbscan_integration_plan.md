# Integrating HDBSCAN for Smart Public Safety Clustering

## Project Context

You have a functioning backend (built with Cursor) that feeds public safety data to a Vercel-hosted frontend. Data is already being collected and visualized, but it lacks any intelligent clustering or analysis.

This document outlines a smart, scalable plan to integrate **HDBSCAN** into your pipeline using your existing architecture.

---

## Goal

Use HDBSCAN to identify meaningful clusters in public safety data (e.g. crime hotspots, unsafe zones, anomalies) and surface those insights on the frontend dynamically.

---

## Step-by-Step Integration Plan

### 1. **Prep the Dataset for Clustering**

- Ensure each incoming data point includes at least:
  - `latitude`, `longitude`
  - `incident_type` or category
  - `timestamp`
- Optionally include context features like:
  - Severity rating
  - Response time
  - Population density

### 2. **Normalize and Clean Input Features**

- Use standard scaling (e.g. `sklearn.preprocessing.StandardScaler`) on continuous fields
- Convert categorical fields into vectors (e.g. one-hot or embeddings)
- Structure the data as a NumPy array or Pandas DataFrame

```python
features = df[["latitude", "longitude", "incident_type_encoded", "severity"]].values
```

### 3. **Train HDBSCAN Model**

- Install and import:

```bash
pip install hdbscan
```

```python
import hdbscan
```

- Choose a `min_cluster_size` appropriate for your use case (e.g. 10 for neighborhoods, 30+ for borough-wide hotspots)

```python
clusterer = hdbscan.HDBSCAN(min_cluster_size=30, metric='euclidean')
cluster_labels = clusterer.fit_predict(features)
```

- Append `cluster_labels` and `probabilities_` to the dataset for downstream use.

### 4. **Serve Clustering Data via API**

- After HDBSCAN clustering, include the following in your API responses:
  - `cluster_id`
  - `membership_probability`
  - `core_sample` flag (optional)

### 5. **Frontend Integration Plan (Vercel)**

- Color-code clusters on your existing map frontend
- Provide cluster-level summaries:
  - Most common incident types per cluster
  - Trend over time (rising/falling danger)
- Add filter controls by `cluster_id`, incident type, or probability

### 6. **Schedule Updates**

- Run clustering job:
  - Daily or hourly depending on data volume
  - Automatically retrain and deploy results

---

## Optional Enhancements

### A. **Use Time Windows**

Cluster data weekly, monthly, or rolling 7-day windows to observe how danger zones shift over time.

### B. **Add Geospatial Distance Metric**

Use Haversine or BallTree if you want true geographic distance instead of Euclidean:

```python
clusterer = hdbscan.HDBSCAN(min_cluster_size=30, metric='haversine')
```

### C. **Visualize with Folium (Dev + QA Only)**

Export clusters to an HTML map for debugging and cluster exploration:

```python
import folium
from folium.plugins import MarkerCluster
```

---

## Deliverables

- Python clustering pipeline (modular)
- JSON API update to include `cluster_id` and probabilities
- Frontend enhancements: coloring, filtering, summaries

---

## Next Step

Once you review this plan, we can generate the starter Python clustering module and the JSON format for your API response.

---

*Created for: Robert Boyle* *Last Updated: July 25, 2025*

