#!/usr/bin/env python3
"""
Test NYPD Arrest Data in Isolation
This script tests the new arrest data source without affecting other data sources.
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from data_fetcher import NYCSafetyDataFetcher
import json
from datetime import datetime, timedelta

def test_broader_date_range():
    """Test with a broader date range to see what data is available"""
    print("🔍 Testing Arrest Data with Broader Date Range")
    print("=" * 50)
    
    fetcher = NYCSafetyDataFetcher()
    
    # Test different date ranges
    date_ranges = [
        ("Last 30 days", 30),
        ("Last 90 days", 90),
        ("Last 180 days", 180),
        ("Last 365 days", 365),
        ("Last 2 years", 730)
    ]
    
    for range_name, days in date_ranges:
        print(f"\n📅 Testing {range_name}...")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days-1)
        start_date_str = start_date.strftime('%Y-%m-%d')
        end_date_str = end_date.strftime('%Y-%m-%d')
        
        print(f"Date range: {start_date_str} to {end_date_str}")
        
        # Test the arrest data with this range
        url = f"{fetcher.socrata_base_url}/uip8-fykc.json"
        params = {
            '$where': f"arrest_date >= '{start_date_str}' AND arrest_date <= '{end_date_str}' AND latitude IS NOT NULL AND longitude IS NOT NULL",
            '$limit': 100,  # Limit for testing
        }
        headers = {'X-App-Token': fetcher.app_token}
        
        try:
            import requests
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            print(f"Results: {len(data)} arrests found")
            
            if data:
                # Show sample data
                sample = data[0]
                print(f"Sample arrest date: {sample.get('arrest_date', 'N/A')}")
                print(f"Sample offense: {sample.get('ofns_desc', 'N/A')}")
                break  # Stop when we find data
                
        except Exception as e:
            print(f"Error: {e}")

def test_full_arrest_dataset():
    """Test getting the full arrest dataset to see total available data"""
    print("\n🔍 Testing Full Arrest Dataset")
    print("=" * 50)
    
    fetcher = NYCSafetyDataFetcher()
    
    # Test without date filtering to see all available data
    url = f"{fetcher.socrata_base_url}/uip8-fykc.json"
    params = {
        '$where': 'latitude IS NOT NULL AND longitude IS NOT NULL',
        '$limit': 5000,  # Full limit
    }
    headers = {'X-App-Token': fetcher.app_token}
    
    try:
        import requests
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print(f"Total arrests available: {len(data)}")
        
        if data:
            # Analyze date range
            dates = [item.get('arrest_date', '') for item in data if item.get('arrest_date')]
            if dates:
                print(f"Date range in dataset: {min(dates)} to {max(dates)}")
            
            # Show sample data
            sample = data[0]
            print(f"\n📋 Sample arrest:")
            print(f"  Date: {sample.get('arrest_date', 'N/A')}")
            print(f"  Offense: {sample.get('ofns_desc', 'N/A')}")
            print(f"  Location: {sample.get('latitude', 'N/A')}, {sample.get('longitude', 'N/A')}")
            
            # Count by offense type
            offense_counts = {}
            for arrest in data:
                offense = arrest.get('ofns_desc', 'UNKNOWN')
                offense_counts[offense] = offense_counts.get(offense, 0) + 1
            
            print(f"\n📈 Top 10 offense types:")
            for offense, count in sorted(offense_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {offense}: {count}")
                
    except Exception as e:
        print(f"Error: {e}")

def main():
    print("🔍 Testing NYPD Arrest Data in Isolation")
    print("=" * 50)
    
    # Initialize the data fetcher
    fetcher = NYCSafetyDataFetcher()
    
    # Test arrest data in isolation
    results = fetcher.test_arrest_data_isolation()
    
    # Print detailed results
    print(f"\n📊 ARREST DATA TEST RESULTS:")
    print(f"Total arrests: {results['total_arrests']}")
    print(f"Date range: {results['date_range']}")
    print(f"Success: {results['success']}")
    
    if results['sample_arrest']:
        print(f"\n📋 Sample arrest:")
        print(json.dumps(results['sample_arrest'], indent=2))
    
    if results['type_breakdown']:
        print(f"\n📈 Arrest type breakdown:")
        for arrest_type, count in sorted(results['type_breakdown'].items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {arrest_type}: {count}")
    
    print(f"\n{'='*50}")
    if results['success']:
        print("✅ Arrest data test completed successfully!")
    else:
        print("❌ Arrest data test failed - no data found")
        print("\n🔄 Testing broader date ranges...")
        test_broader_date_range()
    
    # Test full dataset
    test_full_arrest_dataset()

if __name__ == "__main__":
    main() 