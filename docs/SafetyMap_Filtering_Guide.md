# Safest WebApp - Safety Map Filtering Guide

## Overview
This document explains the logic and rationale behind the filtering and categorization of NYPD incident data for the Safest investor-facing webapp. The goal is to highlight the most relevant safety risks while reducing map clutter and avoiding fear-mongering.

---

## Why Filter?
- **Clarity:** NYC crime data contains dozens of offense types, many of which are rare or not directly relevant to personal safety.
- **Actionability:** Focusing on the most important categories helps users and investors quickly understand real safety risks.
- **Trust:** Transparent filtering builds trust with users and stakeholders.

---

## Key Safety Categories (Displayed on Map)
We have selected the following 15 high-priority categories based on volume, severity, and relevance to personal safety:

1. **ASSAULT 3 & RELATED OFFENSES**
2. **FELONY ASSAULT**
3. **ROBBERY**
4. **BURGLARY**
5. **GRAND LARCENY**
6. **GRAND LARCENY OF MOTOR VEHICLE**
7. **SEX CRIMES**
8. **RAPE**
9. **MURDER & NON-NEGL. MANSLAUGHTER**
10. **DANGEROUS WEAPONS**
11. **DANGEROUS DRUGS**
12. **HARRASSMENT 2**
13. **CRIMINAL TRESPASS**
14. **KIDNAPPING & RELATED OFFENSES**
15. **ARSON**

These categories are chosen for their direct impact on personal safety, property, or public order.

---

## Filtering Logic
- **INCLUDE:** Only incidents where `ofns_desc` matches one of the above categories will be shown as colored markers on the map.
- **EXCLUDE:** All other categories (e.g., minor property crimes, administrative code violations, fraud, gambling, etc.) will be ignored for map display.
- **Color Coding:**
  - Violent crimes (assault, robbery, murder, rape): **Red**
  - Property crimes (burglary, larceny, auto theft): **Orange**
  - Sex crimes: **Purple**
  - Weapons/drugs: **Blue**
  - Harassment/trespass/kidnapping/arson: **Amber**

---

## Rationale
- **Data-Driven:** These categories represent the majority of serious incidents in NYC complaint data.
- **User-Centric:** Focuses on what users and investors care about—real safety risks.
- **Reduces Noise:** Excludes rare, administrative, or non-safety-related incidents.
- **Scalable:** The list can be updated as new data or priorities emerge.

---

## ✅ HDBSCAN Clustering Integration - COMPLETED

We have successfully integrated **HDBSCAN** clustering to identify and visualize crime hotspots and safety clusters on the map. This provides:
- Dynamic, data-driven "danger zones" and anomaly clusters
- Cluster-level summaries and trend analysis
- Enhanced intelligence layer of the Safest platform

### Implementation ✅
- **Python Backend:** Complete modular pipeline in `backend-clustering/`
- **Data Processing:** Fetches from Socrata API with existing filtering logic
- **Clustering Analysis:** HDBSCAN algorithm with geographic and temporal features
- **Results Export:** Multiple JSON formats for frontend integration

### Latest Results (July 25, 2025)
- **Total Incidents Processed:** 7,196 (5,000 911 calls + 2,196 filtered complaints)
- **Clusters Identified:** 46 distinct safety hotspots
- **High Severity Clusters:** 11 clusters with severity > 7
- **Average Cluster Severity:** 5.70
- **Geographic Coverage:** Full NYC area with valid coordinates

### Key Features
- **Geographic Clustering:** Identifies spatial hotspots using lat/lng coordinates
- **Severity Analysis:** Ranks clusters by safety risk (1-10 scale)
- **Temporal Patterns:** Analyzes hour, day, and month patterns
- **Incident Type Distribution:** Shows crime type breakdown per cluster

### Output Files for Frontend
- `cluster_centroids_*.json` - Optimized for Mapbox integration
- `clusters_*.json` - Complete clustering results
- `noise_points_*.json` - Outlier incidents
- `pipeline_summary_*.json` - Analysis summary and recommendations

### Frontend Integration Ready
The clustering results are ready for frontend visualization with:
- Cluster centroids as map markers
- Color coding by severity score
- Popup information with incident type breakdowns
- Temporal analysis for trend identification

---

## Next Steps
- The webapp will display only these categories by default
- HDBSCAN clustering integration is in progress (see project plan)
- Additional filtering, grouping, or user controls can be added in future iterations

---

## Contact
For questions or to suggest changes to the filtering logic, contact the Safest product team. 