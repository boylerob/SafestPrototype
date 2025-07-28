#!/usr/bin/env python3
"""
Trace coordinate flow from backend clustering to frontend visualization
"""

import json
import os

def trace_coordinate_flow():
    """Trace how coordinates flow through the data pipeline"""
    
    print("=== Tracing Coordinate Flow ===")
    
    # 1. Check backend clustering output
    print("\n=== 1. Backend Clustering Output ===")
    backend_file = "output/cluster_centroids_20250728_135405.json"
    
    if os.path.exists(backend_file):
        with open(backend_file, 'r') as f:
            backend_data = json.load(f)
        
        print(f"Backend file: {backend_file}")
        print(f"Total clusters: {len(backend_data['clusters'])}")
        
        # Show first few centroids
        print("\nFirst 5 centroids from backend:")
        for i, cluster in enumerate(backend_data['clusters'][:5]):
            centroid = cluster['centroid']
            print(f"  Cluster {i}: [{centroid[0]:.6f}, {centroid[1]:.6f}]")
            print(f"    Format: [latitude, longitude]")
            print(f"    Expected NYC: lat ~40.4-40.9, lng ~-74.3 to -73.7")
            
            # Check if coordinates are in NYC bounds
            lat_ok = 40.4 <= centroid[0] <= 40.9
            lng_ok = -74.3 <= centroid[1] <= -73.7
            
            if lat_ok and lng_ok:
                print(f"    ✅ Coordinates are in NYC bounds")
            else:
                print(f"    ❌ Coordinates are OUTSIDE NYC bounds!")
    else:
        print(f"Backend file not found: {backend_file}")
    
    # 2. Check frontend clustering data
    print("\n=== 2. Frontend Clustering Data ===")
    frontend_file = "../safest-webapp/public/clustering-data.json"
    
    if os.path.exists(frontend_file):
        with open(frontend_file, 'r') as f:
            frontend_data = json.load(f)
        
        print(f"Frontend file: {frontend_file}")
        print(f"Total clusters: {len(frontend_data['clusters'])}")
        
        # Show first few centroids
        print("\nFirst 5 centroids from frontend:")
        for i, cluster in enumerate(frontend_data['clusters'][:5]):
            centroid = cluster['centroid']
            print(f"  Cluster {i}: [{centroid[0]:.6f}, {centroid[1]:.6f}]")
            print(f"    Format: [latitude, longitude]")
            print(f"    Expected NYC: lat ~40.4-40.9, lng ~-74.3 to -73.7")
            
            # Check if coordinates are in NYC bounds
            lat_ok = 40.4 <= centroid[0] <= 40.9
            lng_ok = -74.3 <= centroid[1] <= -73.7
            
            if lat_ok and lng_ok:
                print(f"    ✅ Coordinates are in NYC bounds")
            else:
                print(f"    ❌ Coordinates are OUTSIDE NYC bounds!")
    else:
        print(f"Frontend file not found: {frontend_file}")
    
    # 3. Compare backend vs frontend
    print("\n=== 3. Backend vs Frontend Comparison ===")
    
    if os.path.exists(backend_file) and os.path.exists(frontend_file):
        with open(backend_file, 'r') as f:
            backend_data = json.load(f)
        with open(frontend_file, 'r') as f:
            frontend_data = json.load(f)
        
        print(f"Backend clusters: {len(backend_data['clusters'])}")
        print(f"Frontend clusters: {len(frontend_data['clusters'])}")
        
        # Compare first few centroids
        print("\nCoordinate comparison (first 3 clusters):")
        for i in range(min(3, len(backend_data['clusters']), len(frontend_data['clusters']))):
            backend_centroid = backend_data['clusters'][i]['centroid']
            frontend_centroid = frontend_data['clusters'][i]['centroid']
            
            print(f"  Cluster {i}:")
            print(f"    Backend:  [{backend_centroid[0]:.6f}, {backend_centroid[1]:.6f}]")
            print(f"    Frontend: [{frontend_centroid[0]:.6f}, {frontend_centroid[1]:.6f}]")
            
            # Check if they match
            lat_match = abs(backend_centroid[0] - frontend_centroid[0]) < 0.000001
            lng_match = abs(backend_centroid[1] - frontend_centroid[1]) < 0.000001
            
            if lat_match and lng_match:
                print(f"    ✅ Coordinates match")
            else:
                print(f"    ❌ Coordinates DO NOT match!")
                print(f"    Lat difference: {abs(backend_centroid[0] - frontend_centroid[0]):.6f}")
                print(f"    Lng difference: {abs(backend_centroid[1] - frontend_centroid[1]):.6f}")
    
    # 4. Check coordinate interpretation in frontend
    print("\n=== 4. Frontend Coordinate Interpretation ===")
    print("From SafetyMap.tsx:")
    print("  // Centroid is [lat, lng] format, Mapbox expects [lng, lat]")
    print("  const lngLat: [number, number] = [cluster.centroid[1], cluster.centroid[0]];")
    print("  console.log(`Setting marker at: [${lngLat[0]}, ${lngLat[1]}]`);")
    print()
    print("This means:")
    print("  - Backend sends: [latitude, longitude]")
    print("  - Frontend receives: [latitude, longitude]")
    print("  - Frontend converts to: [longitude, latitude] for Mapbox")
    print("  - Mapbox displays: [longitude, latitude]")
    
    # 5. Test coordinate conversion
    print("\n=== 5. Coordinate Conversion Test ===")
    if os.path.exists(backend_file):
        with open(backend_file, 'r') as f:
            backend_data = json.load(f)
        
        sample_centroid = backend_data['clusters'][0]['centroid']
        print(f"Sample centroid from backend: [{sample_centroid[0]:.6f}, {sample_centroid[1]:.6f}]")
        print(f"  Format: [latitude, longitude]")
        
        # Simulate frontend conversion
        lng_lat = [sample_centroid[1], sample_centroid[0]]
        print(f"After frontend conversion: [{lng_lat[0]:.6f}, {lng_lat[1]:.6f}]")
        print(f"  Format: [longitude, latitude]")
        
        # Check if this would appear in water
        lng = lng_lat[0]
        lat = lng_lat[1]
        
        print(f"\nMapbox interpretation:")
        print(f"  Longitude: {lng:.6f} (should be ~-74.3 to -73.7 for NYC)")
        print(f"  Latitude:  {lat:.6f} (should be ~40.4-40.9 for NYC)")
        
        if -74.3 <= lng <= -73.7 and 40.4 <= lat <= 40.9:
            print(f"  ✅ Would appear in NYC")
        else:
            print(f"  ❌ Would appear outside NYC (possibly in water)")

if __name__ == "__main__":
    trace_coordinate_flow() 