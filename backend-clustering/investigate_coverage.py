#!/usr/bin/env python3
"""
Investigate Data Coverage Issues
This script analyzes our data coverage to identify gaps, API limits, and geographic issues.
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from data_fetcher import NYCSafetyDataFetcher
import requests
import json
from datetime import datetime, timedelta

def test_api_limits():
    """Test different API limits to see what we can actually get"""
    print("🔍 Testing API Limits and Data Coverage")
    print("=" * 60)
    
    fetcher = NYCSafetyDataFetcher()
    
    # Test different limits
    limits = [100, 1000, 5000, 10000, 50000]
    
    for limit in limits:
        print(f"\n📊 Testing limit: {limit}")
        
        url = f"{fetcher.socrata_base_url}/uip8-fykc.json"
        params = {
            '$where': 'latitude IS NOT NULL AND longitude IS NOT NULL',
            '$limit': limit,
        }
        headers = {'X-App-Token': fetcher.app_token}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            print(f"  Results: {len(data)} arrests")
            
            if data:
                # Check geographic coverage
                lats = [float(item.get('latitude', 0)) for item in data if item.get('latitude')]
                lngs = [float(item.get('longitude', 0)) for item in data if item.get('longitude')]
                
                if lats and lngs:
                    print(f"  Geographic bounds: Lat {min(lats):.4f} to {max(lats):.4f}")
                    print(f"  Geographic bounds: Lng {min(lngs):.4f} to {max(lngs):.4f}")
                
                # Check date range
                dates = [item.get('arrest_date', '') for item in data if item.get('arrest_date')]
                if dates:
                    print(f"  Date range: {min(dates)} to {max(dates)}")
                
                # Check if we're hitting the limit
                if len(data) == limit:
                    print(f"  ⚠️  Hitting API limit of {limit}")
                else:
                    print(f"  ✅ Not hitting limit (got {len(data)} of {limit})")
                    
        except Exception as e:
            print(f"  ❌ Error: {e}")

def test_geographic_coverage():
    """Test geographic coverage by borough/area"""
    print("\n🗺️  Testing Geographic Coverage")
    print("=" * 60)
    
    fetcher = NYCSafetyDataFetcher()
    
    # NYC boroughs and their approximate coordinates
    boroughs = {
        "Bronx": {"lat": (40.7855, 40.9176), "lng": (-73.9334, -73.7654)},
        "Brooklyn": {"lat": (40.5707, 40.7395), "lng": (-74.0411, -73.8556)},
        "Manhattan": {"lat": (40.7000, 40.8800), "lng": (-74.0500, -73.9000)},
        "Queens": {"lat": (40.5433, 40.8000), "lng": (-73.9633, -73.7000)},
        "Staten Island": {"lat": (40.4774, 40.7395), "lng": (-74.2591, -74.0411)}
    }
    
    # Test each borough
    for borough, coords in boroughs.items():
        print(f"\n📍 Testing {borough}:")
        
        # Query for this borough's area
        lat_min, lat_max = coords["lat"]
        lng_min, lng_max = coords["lng"]
        
        url = f"{fetcher.socrata_base_url}/uip8-fykc.json"
        params = {
            '$where': f'latitude >= {lat_min} AND latitude <= {lat_max} AND longitude >= {lng_min} AND longitude <= {lng_max} AND latitude IS NOT NULL AND longitude IS NOT NULL',
            '$limit': 1000,
        }
        headers = {'X-App-Token': fetcher.app_token}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            print(f"  {borough} arrests: {len(data)}")
            
            if data:
                # Show sample arrests
                sample = data[0]
                print(f"  Sample: {sample.get('ofns_desc', 'N/A')} at {sample.get('latitude', 'N/A')}, {sample.get('longitude', 'N/A')}")
            else:
                print(f"  ⚠️  No arrests found in {borough}")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")

def test_dangerous_areas():
    """Test specific areas known for high crime rates"""
    print("\n⚠️  Testing Known High-Crime Areas")
    print("=" * 60)
    
    fetcher = NYCSafetyDataFetcher()
    
    # Areas known for higher crime rates (approximate coordinates)
    high_crime_areas = {
        "South Bronx": {"lat": (40.8000, 40.8500), "lng": (-73.9000, -73.8500)},
        "East New York, Brooklyn": {"lat": (40.6500, 40.7000), "lng": (-73.9000, -73.8500)},
        "Harlem, Manhattan": {"lat": (40.8000, 40.8500), "lng": (-73.9500, -73.9000)},
        "Jamaica, Queens": {"lat": (40.6800, 40.7300), "lng": (-73.8000, -73.7500)},
        "Stapleton, Staten Island": {"lat": (40.6200, 40.6700), "lng": (-74.1000, -74.0500)}
    }
    
    for area, coords in high_crime_areas.items():
        print(f"\n🔍 Testing {area}:")
        
        lat_min, lat_max = coords["lat"]
        lng_min, lng_max = coords["lng"]
        
        url = f"{fetcher.socrata_base_url}/uip8-fykc.json"
        params = {
            '$where': f'latitude >= {lat_min} AND latitude <= {lat_max} AND longitude >= {lng_min} AND longitude <= {lng_max} AND latitude IS NOT NULL AND longitude IS NOT NULL',
            '$limit': 500,
        }
        headers = {'X-App-Token': fetcher.app_token}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            print(f"  {area} arrests: {len(data)}")
            
            if data:
                # Count by offense type
                offenses = {}
                for arrest in data:
                    offense = arrest.get('ofns_desc', 'UNKNOWN')
                    offenses[offense] = offenses.get(offense, 0) + 1
                
                print(f"  Top offenses:")
                for offense, count in sorted(offenses.items(), key=lambda x: x[1], reverse=True)[:3]:
                    print(f"    {offense}: {count}")
            else:
                print(f"  ⚠️  No arrests found in {area} - this is suspicious!")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")

def test_date_coverage():
    """Test different date ranges to see data availability"""
    print("\n📅 Testing Date Coverage")
    print("=" * 60)
    
    fetcher = NYCSafetyDataFetcher()
    
    # Test different date ranges
    date_ranges = [
        ("Last 30 days", 30),
        ("Last 90 days", 90),
        ("Last 180 days", 180),
        ("Last 365 days", 365),
        ("Year 2025", "2025-01-01", "2025-12-31"),
        ("Year 2024", "2024-01-01", "2024-12-31"),
    ]
    
    for range_name, *params in date_ranges:
        print(f"\n📅 Testing {range_name}:")
        
        if len(params) == 1:
            # Dynamic range
            days = params[0]
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days-1)
            start_date_str = start_date.strftime('%Y-%m-%d')
            end_date_str = end_date.strftime('%Y-%m-%d')
        else:
            # Fixed range
            start_date_str, end_date_str = params
        
        print(f"  Date range: {start_date_str} to {end_date_str}")
        
        url = f"{fetcher.socrata_base_url}/uip8-fykc.json"
        params = {
            '$where': f"arrest_date >= '{start_date_str}' AND arrest_date <= '{end_date_str}' AND latitude IS NOT NULL AND longitude IS NOT NULL",
            '$limit': 1000,
        }
        headers = {'X-App-Token': fetcher.app_token}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            print(f"  Results: {len(data)} arrests")
            
            if data:
                # Show date distribution
                dates = [item.get('arrest_date', '')[:10] for item in data if item.get('arrest_date')]
                if dates:
                    unique_dates = set(dates)
                    print(f"  Unique dates: {len(unique_dates)}")
                    print(f"  Date range: {min(dates)} to {max(dates)}")
                    
        except Exception as e:
            print(f"  ❌ Error: {e}")

def main():
    print("🔍 Investigating Data Coverage Issues")
    print("=" * 60)
    
    # Run all tests
    test_api_limits()
    test_geographic_coverage()
    test_dangerous_areas()
    test_date_coverage()
    
    print(f"\n{'='*60}")
    print("✅ Coverage investigation completed!")

if __name__ == "__main__":
    main() 