#!/usr/bin/env python3
"""
Coordinate Source Investigation
Checks the original data source for coordinate issues
"""

import pandas as pd
import json
import os
from datetime import datetime

def investigate_coordinate_source():
    """Investigate the original coordinate source for issues"""
    
    # Find the most recent data file
    data_dir = "data"
    data_files = [f for f in os.listdir(data_dir) if f.startswith("nyc_safety_incidents_") and f.endswith(".csv")]
    
    if not data_files:
        print("❌ No data files found")
        return
    
    latest_file = max(data_files)
    file_path = os.path.join(data_dir, latest_file)
    
    print(f"🔍 Investigating coordinates in: {file_path}")
    
    # Load the original data
    df = pd.read_csv(file_path)
    print(f"📊 Loaded {len(df)} incidents")
    
    # Check coordinate columns
    print("\n=== COORDINATE COLUMN ANALYSIS ===")
    print(f"Columns: {list(df.columns)}")
    
    if 'latitude' in df.columns and 'longitude' in df.columns:
        print(f"✅ Found latitude and longitude columns")
        
        # Check coordinate ranges
        lat_min, lat_max = df['latitude'].min(), df['latitude'].max()
        lng_min, lng_max = df['longitude'].min(), df['longitude'].max()
        
        print(f"\nCoordinate Ranges:")
        print(f"  Latitude:  {lat_min:.6f} to {lat_max:.6f}")
        print(f"  Longitude: {lng_min:.6f} to {lng_max:.6f}")
        
        # Check for NYC bounds
        nyc_lat_min, nyc_lat_max = 40.4, 40.9
        nyc_lng_min, nyc_lng_max = -74.3, -73.7
        
        in_nyc = ((df['latitude'] >= nyc_lat_min) & (df['latitude'] <= nyc_lat_max) & 
                  (df['longitude'] >= nyc_lng_min) & (df['longitude'] <= nyc_lng_max))
        
        print(f"\nNYC Bounds Check:")
        print(f"  In NYC bounds: {in_nyc.sum()} ({in_nyc.mean()*100:.1f}%)")
        print(f"  Outside NYC: {len(df) - in_nyc.sum()} ({(1-in_nyc.mean())*100:.1f}%)")
        
        # Check for (0,0) coordinates
        zero_coords = ((df['latitude'] == 0) & (df['longitude'] == 0))
        print(f"  (0,0) coordinates: {zero_coords.sum()}")
        
        # Check for NaN coordinates
        nan_coords = (df['latitude'].isna() | df['longitude'].isna())
        print(f"  NaN coordinates: {nan_coords.sum()}")
        
        # Sample some coordinates
        print(f"\n=== SAMPLE COORDINATES ===")
        sample_df = df.head(10)
        for idx, row in sample_df.iterrows():
            lat, lng = row['latitude'], row['longitude']
            in_nyc_sample = (nyc_lat_min <= lat <= nyc_lat_max and 
                           nyc_lng_min <= lng <= nyc_lng_max)
            print(f"  {idx}: [{lat:.6f}, {lng:.6f}] - {'✅ NYC' if in_nyc_sample else '❌ Outside NYC'}")
        
        # Check if coordinates might be swapped
        print(f"\n=== COORDINATE SWAP ANALYSIS ===")
        # Check if longitude values are in latitude range and vice versa
        lat_as_lng = ((df['latitude'] >= nyc_lng_min) & (df['latitude'] <= nyc_lng_max))
        lng_as_lat = ((df['longitude'] >= nyc_lat_min) & (df['longitude'] <= nyc_lat_max))
        
        potentially_swapped = lat_as_lng & lng_as_lat
        print(f"  Potentially swapped coordinates: {potentially_swapped.sum()}")
        
        if potentially_swapped.sum() > 0:
            print(f"  ⚠️  Found {potentially_swapped.sum()} coordinates that might be swapped!")
            sample_swapped = df[potentially_swapped].head(5)
            for idx, row in sample_swapped.iterrows():
                lat, lng = row['latitude'], row['longitude']
                print(f"    Sample swapped: [{lat:.6f}, {lng:.6f}]")
    
    else:
        print("❌ No latitude/longitude columns found")
        print(f"Available columns: {list(df.columns)}")

if __name__ == "__main__":
    investigate_coordinate_source() 