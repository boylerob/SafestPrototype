# Clustering and Visualization Troubleshooting Guide

## Overview
This document outlines the investigation into coordinate mapping issues where safety clusters were appearing in incorrect geographic locations (water, Staten Island, New Jersey) despite raw data appearing correct.

## Key Findings

### ✅ What We've Confirmed is Working

#### 1. **Socrata API Data Quality**
- **Status**: ✅ Working as expected
- **Evidence**: 
  - 911 calls: 5,000 incidents with 0 (0,0) coordinates
  - NYPD complaints: 2,196 incidents with only 4 (0,0) coordinates (0.1%)
  - 99.8% of all incidents have valid NYC coordinates
  - Geographic bounds: Lat 40.5-40.9, Lng -74.3 to -73.7 (proper NYC range)
- **Conclusion**: Data source is not the culprit for visualization issues

#### 2. **Mapbox Visualization**
- **Status**: ✅ Working as expected
- **Evidence**: 
  - Times Square test marker appeared in correct location
  - Mapbox coordinate interpretation is functioning properly
  - No systematic coordinate transformation issues in the frontend
- **Conclusion**: Mapbox rendering is not the culprit

#### 3. **Coordinate Data Quality**
- **Status**: ✅ Minimal issues
- **Evidence**:
  - Only 4 incidents out of 7,196 have (0,0) coordinates (0.1%)
  - 7,183 incidents have valid NYC coordinates (99.8%)
  - 13 incidents outside NYC bounds (0.2%)
- **Conclusion**: (0,0) coordinates are not the main culprit

### ❌ What We've Ruled Out

1. **Socrata API data corruption** - Data quality is excellent
2. **Mapbox coordinate interpretation** - Times Square test proved it works
3. **Systematic coordinate transformation** - No evidence of uniform offset
4. **(0,0) coordinate contamination** - Only 0.1% of data affected
5. **HDBSCAN coordinate scaling** - Fixed StandardScaler issue but offset persists

### 🔍 Remaining Investigation Areas

#### 1. **HDBSCAN Clustering Algorithm**
- **Potential Issues**:
  - Coordinate scaling during preprocessing
  - Distance metric selection (Euclidean vs. Haversine)
  - Feature selection and dimensionality
  - Cluster centroid calculation method

#### 2. **Data Pipeline Between Raw Data and Visualization**
- **Potential Issues**:
  - JSON serialization/deserialization
  - Coordinate format conversion
  - Data transformation between Python backend and JavaScript frontend
  - API response formatting

#### 3. **Cluster Data Format**
- **Potential Issues**:
  - Centroid coordinate order (lat/lng vs lng/lat)
  - JSON structure compatibility
  - Data type conversion issues

## Investigation Timeline

### Phase 1: Data Source Investigation ✅
- **Result**: Socrata API data is clean and properly formatted
- **Evidence**: 99.8% valid coordinates, proper NYC bounds

### Phase 2: Frontend Visualization Investigation ✅
- **Result**: Mapbox is working correctly
- **Evidence**: Times Square test marker appeared in correct location

### Phase 3: Coordinate Quality Investigation ✅
- **Result**: (0,0) coordinates are minimal (0.1% of data)
- **Evidence**: Only 4 incidents out of 7,196 have invalid coordinates

### Phase 4: Backend Clustering Investigation ✅
- **Status**: Completed
- **Result**: Fixed StandardScaler coordinate scaling issue
- **Evidence**: Clusters maintain Manhattan shape but still appear in water
- **Conclusion**: Issue is NOT in HDBSCAN preprocessing

### Phase 5: Coordinate Interpretation Investigation 🔄
- **Status**: In progress
- **Focus**: Coordinate system, projection, or transformation in visualization pipeline

## Next Steps

1. **Investigate coordinate system/projection** - Check if there's a coordinate system mismatch
2. **Examine coordinate order handling** - Verify lat/lng vs lng/lat interpretation
3. **Check for hidden coordinate transformations** - Look for manual corrections or adjustments
4. **Test coordinate interpretation** - Verify how Mapbox is interpreting the coordinate data

## Key Metrics

- **Total Incidents**: 7,196
- **Valid NYC Coordinates**: 7,183 (99.8%)
- **(0,0) Coordinates**: 4 (0.1%)
- **Outside NYC Bounds**: 13 (0.2%)
- **911 Calls**: 5,000 (all valid)
- **NYPD Complaints**: 2,196 (4 invalid)

## Conclusion

The coordinate mapping issue is **not** caused by:
- ❌ Socrata API data quality
- ❌ Mapbox visualization
- ❌ (0,0) coordinate contamination
- ❌ HDBSCAN coordinate scaling (StandardScaler)

The issue likely lies in the **coordinate interpretation or transformation** in the visualization pipeline, not the clustering algorithm itself.

**Key Evidence**: Clusters maintain Manhattan shape but are uniformly shifted into water, indicating systematic coordinate transformation rather than clustering algorithm issues.

**Next Focus**: Investigate coordinate system, projection, or hidden transformations in the visualization pipeline. 