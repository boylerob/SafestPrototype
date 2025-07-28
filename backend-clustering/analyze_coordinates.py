#!/usr/bin/env python3
"""
Coordinate Analysis Script
Analyzes clustering data to identify coordinate issues
"""

import json
import os
from datetime import datetime

def analyze_coordinates():
    """Analyze coordinate patterns in clustering data"""
    
    # Find the most recent clustering data
    output_dir = "output"
    clustering_files = [f for f in os.listdir(output_dir) if f.startswith("cluster_centroids_") and f.endswith(".json")]
    
    if not clustering_files:
        print("❌ No clustering data files found")
        return
    
    # Get the most recent file
    latest_file = max(clustering_files)
    file_path = os.path.join(output_dir, latest_file)
    
    print(f"🔍 Analyzing coordinates in: {file_path}")
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    clusters = data.get('clusters', [])
    print(f"📊 Found {len(clusters)} clusters")
    
    # NYC bounds
    nyc_bounds = {
        'lat_min': 40.4,
        'lat_max': 40.9,
        'lng_min': -74.3,
        'lng_max': -73.7
    }
    
    # Analyze each cluster
    in_nyc_count = 0
    out_of_nyc_count = 0
    water_count = 0
    coordinate_issues = []
    
    print("\n=== COORDINATE ANALYSIS ===")
    print(f"NYC Bounds: Lat {nyc_bounds['lat_min']}-{nyc_bounds['lat_max']}, Lng {nyc_bounds['lng_min']}-{nyc_bounds['lng_max']}")
    print()
    
    for i, cluster in enumerate(clusters[:10] if len(clusters) > 10 else clusters):  # Analyze first 10 clusters
        centroid = cluster['centroid']
        lat, lng = centroid[0], centroid[1]
        
        # Check if in NYC bounds
        in_nyc = (nyc_bounds['lat_min'] <= lat <= nyc_bounds['lat_max'] and 
                  nyc_bounds['lng_min'] <= lng <= nyc_bounds['lng_max'])
        
        # Check if likely in water (Staten Island area)
        in_water = (lat < 40.5 and lng < -74.0)  # Rough Staten Island area
        
        if in_nyc:
            in_nyc_count += 1
            status = "✅ NYC"
        elif in_water:
            water_count += 1
            status = "🌊 WATER"
            coordinate_issues.append({
                'cluster_id': cluster['cluster_id'],
                'coordinates': [lat, lng],
                'issue': 'water'
            })
        else:
            out_of_nyc_count += 1
            status = "❌ OUTSIDE NYC"
            coordinate_issues.append({
                'cluster_id': cluster['cluster_id'],
                'coordinates': [lat, lng],
                'issue': 'outside_nyc'
            })
        
        print(f"Cluster {cluster['cluster_id']:2d}: [{lat:8.6f}, {lng:8.6f}] - {status}")
    
    print(f"\n=== SUMMARY ===")
    print(f"In NYC: {in_nyc_count}")
    print(f"In water: {water_count}")
    print(f"Outside NYC: {out_of_nyc_count}")
    
    if coordinate_issues:
        print(f"\n=== ISSUES FOUND ===")
        for issue in coordinate_issues:
            print(f"Cluster {issue['cluster_id']}: {issue['coordinates']} - {issue['issue']}")
    
    # Check coordinate ranges
    all_lats = [c['centroid'][0] for c in clusters]
    all_lngs = [c['centroid'][1] for c in clusters]
    
    print(f"\n=== COORDINATE RANGES ===")
    print(f"Latitude:  {min(all_lats):8.6f} to {max(all_lats):8.6f}")
    print(f"Longitude: {min(all_lngs):8.6f} to {max(all_lngs):8.6f}")
    
    # Check for any (0,0) coordinates
    zero_coords = [c for c in clusters if c['centroid'][0] == 0 and c['centroid'][1] == 0]
    if zero_coords:
        print(f"\n⚠️  Found {len(zero_coords)} clusters with (0,0) coordinates")
    
    # Check for any NaN coordinates
    nan_coords = [c for c in clusters if any(not isinstance(coord, (int, float)) or coord != coord for coord in c['centroid'])]
    if nan_coords:
        print(f"\n⚠️  Found {len(nan_coords)} clusters with NaN coordinates")

if __name__ == "__main__":
    analyze_coordinates() 