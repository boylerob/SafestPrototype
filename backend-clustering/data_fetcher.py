#!/usr/bin/env python3
"""
NYC Safety Data Fetcher for HDBSCAN Clustering
Fetches filtered safety incidents from Socrata API and prepares data for clustering analysis.
"""

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import os
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NYCSafetyDataFetcher:
    """Fetches and filters NYC safety data from Socrata API"""
    
    def __init__(self):
        self.socrata_base_url = "https://data.cityofnewyork.us/resource"
        self.app_token = "n2PZFq0XnEDLLRo0IIrw7sSHs"
        
        # Key safety categories (same as webapp filtering)
        self.key_categories = [
            'ASSAULT 3 & RELATED OFFENSES',
            'FELONY ASSAULT',
            'ROBBERY',
            'BURGLARY',
            'GRAND LARCENY',
            'GRAND LARCENY OF MOTOR VEHICLE',
            'SEX CRIMES',
            'RAPE',
            'MURDER & NON-NEGL. MANSLAUGHTER',
            'DANGEROUS WEAPONS',
            'DANGEROUS DRUGS',
            'HARRASSMENT 2',
            'CRIMINAL TRESPASS',
            'KIDNAPPING & RELATED OFFENSES',
            'ARSON',
        ]
        
        # Create data directory if it doesn't exist
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(self.data_dir, exist_ok=True)
        
    def fetch_911_calls(self) -> List[Dict[str, Any]]:
        """Fetch NYPD Calls for Service (911 calls)"""
        logger.info("Fetching NYPD Calls for Service...")
        
        url = f"{self.socrata_base_url}/n2zq-pubd.json"
        params = {
            '$where': 'latitude IS NOT NULL AND longitude IS NOT NULL',
            '$limit': 5000,
        }
        headers = {'X-App-Token': self.app_token}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # Filter and clean data
            filtered_calls = []
            for incident in data:
                try:
                    lat = float(incident.get('latitude', ''))
                    lng = float(incident.get('longitude', ''))
                    
                    if not (isnan(lat) or isnan(lng)):
                        filtered_calls.append({
                            'id': incident.get('cad_number') or incident.get('incident_number') or f"call_{len(filtered_calls)}",
                            'latitude': lat,
                            'longitude': lng,
                            'type': incident.get('final_call_type') or incident.get('radio_code') or '911_CALL',
                            'description': incident.get('radio_code') or 'Emergency Call',
                            'timestamp': incident.get('entry_date_time') or incident.get('dispatch_date_time') or '',
                            'source': '911_calls'
                        })
                except (ValueError, TypeError):
                    continue
            
            logger.info(f"Fetched {len(filtered_calls)} valid 911 calls")
            return filtered_calls
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching 911 calls: {e}")
            return []
    
    def fetch_nypd_complaints(self) -> List[Dict[str, Any]]:
        """Fetch NYPD Complaints with date filtering"""
        logger.info("Fetching NYPD Complaints...")
        
        # Calculate date for 1 year ago
        one_year_ago = datetime.now() - timedelta(days=365)
        socrata_date = one_year_ago.strftime('%Y-%m-%d')
        
        url = f"{self.socrata_base_url}/5uac-w243.json"
        params = {
            '$where': f"cmplnt_fr_dt >= '{socrata_date}' AND latitude IS NOT NULL AND longitude IS NOT NULL",
            '$limit': 5000,
        }
        headers = {'X-App-Token': self.app_token}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # Filter by key categories and clean data
            filtered_complaints = []
            for incident in data:
                try:
                    # Check if incident is in key categories
                    offense_desc = incident.get('ofns_desc', '')
                    if offense_desc in self.key_categories:
                        lat = float(incident.get('latitude', ''))
                        lng = float(incident.get('longitude', ''))
                        
                        if not (isnan(lat) or isnan(lng)):
                            filtered_complaints.append({
                                'id': incident.get('cmplnt_num', f"complaint_{len(filtered_complaints)}"),
                                'latitude': lat,
                                'longitude': lng,
                                'type': offense_desc,
                                'description': incident.get('pd_desc', ''),
                                'timestamp': incident.get('cmplnt_fr_dt', ''),
                                'source': 'nypd_complaints'
                            })
                except (ValueError, TypeError):
                    continue
            
            logger.info(f"Fetched {len(filtered_complaints)} filtered NYPD complaints")
            return filtered_complaints
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching NYPD complaints: {e}")
            return []
    
    def combine_and_clean_data(self, calls: List[Dict], complaints: List[Dict]) -> pd.DataFrame:
        """Combine and clean all incident data"""
        logger.info("Combining and cleaning incident data...")
        
        # Combine all incidents
        all_incidents = calls + complaints
        
        if not all_incidents:
            logger.warning("No incidents found!")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(all_incidents)
        
        # Add additional features for clustering
        df['date'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df['day_of_week'] = df['date'].dt.day_name()
        df['hour'] = df['date'].dt.hour
        df['month'] = df['date'].dt.month
        
        # Create severity score based on incident type
        severity_mapping = {
            'MURDER & NON-NEGL. MANSLAUGHTER': 10,
            'RAPE': 9,
            'FELONY ASSAULT': 8,
            'ROBBERY': 7,
            'BURGLARY': 6,
            'GRAND LARCENY': 5,
            'GRAND LARCENY OF MOTOR VEHICLE': 5,
            'DANGEROUS WEAPONS': 7,
            'SEX CRIMES': 8,
            'ASSAULT 3 & RELATED OFFENSES': 6,
            'DANGEROUS DRUGS': 4,
            'HARRASSMENT 2': 3,
            'CRIMINAL TRESPASS': 3,
            'KIDNAPPING & RELATED OFFENSES': 9,
            'ARSON': 8,
        }
        
        df['severity_score'] = df['type'].map(severity_mapping).fillna(3)
        
        # Remove rows with missing coordinates
        df = df.dropna(subset=['latitude', 'longitude'])
        
        logger.info(f"Final dataset: {len(df)} incidents with {len(df.columns)} features")
        return df
    
    def save_data(self, df: pd.DataFrame, filename: Optional[str] = None) -> str:
        """Save processed data to CSV file"""
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"nyc_safety_incidents_{timestamp}.csv"
        
        filepath = os.path.join(self.data_dir, filename)
        df.to_csv(filepath, index=False)
        
        logger.info(f"Data saved to: {filepath}")
        return filepath
    
    def fetch_and_process(self, save_filename: Optional[str] = None) -> str:
        """Main method to fetch, process, and save all safety data"""
        logger.info("Starting NYC safety data fetch and processing...")
        
        # Fetch data from both sources
        calls = self.fetch_911_calls()
        complaints = self.fetch_nypd_complaints()
        
        # Combine and clean
        df = self.combine_and_clean_data(calls, complaints)
        
        if df.empty:
            raise ValueError("No data was successfully fetched and processed")
        
        # Save to CSV
        filepath = self.save_data(df, save_filename)
        
        # Print summary statistics
        logger.info("=== DATA SUMMARY ===")
        logger.info(f"Total incidents: {len(df)}")
        logger.info(f"911 calls: {len(df[df['source'] == '911_calls'])}")
        logger.info(f"NYPD complaints: {len(df[df['source'] == 'nypd_complaints'])}")
        logger.info(f"Date range: {df['date'].min()} to {df['date'].max()}")
        logger.info(f"Geographic bounds: Lat {df['latitude'].min():.4f} to {df['latitude'].max():.4f}")
        logger.info(f"Geographic bounds: Lng {df['longitude'].min():.4f} to {df['longitude'].max():.4f}")
        
        return filepath

def isnan(value):
    """Check if value is NaN"""
    try:
        return pd.isna(value)
    except:
        return False

if __name__ == "__main__":
    # Example usage
    fetcher = NYCSafetyDataFetcher()
    try:
        csv_file = fetcher.fetch_and_process()
        print(f"\n✅ Data successfully fetched and saved to: {csv_file}")
        print("Ready for HDBSCAN clustering analysis!")
    except Exception as e:
        logger.error(f"Error in data fetching process: {e}")
        exit(1) 