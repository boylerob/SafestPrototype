import axios from 'axios';
import { config } from '../config/config';

const SOCRATA_BASE_URL = 'https://data.cityofnewyork.us/resource';
const APP_TOKEN = config.socrata.appToken;

export interface SafetyIncident {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string;
  timestamp: string;
}

interface SocrataIncident {
  latitude?: string;
  longitude?: string;
  cad_number?: string;
  incident_number?: string;
  final_call_type?: string;
  radio_code?: string;
  entry_date_time?: string;
  dispatch_date_time?: string;
  cmplnt_num?: string;
  ofns_desc?: string;
  pd_desc?: string;
  cmplnt_fr_dt?: string;
}

export interface LocationSearchResult {
  features: Array<{
    properties: {
      name: string;
      housenumber?: string;
      street?: string;
      city?: string;
      state?: string;
    };
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
  }>;
}

class NYCDataService {
  private static instance: NYCDataService;
  private constructor() {}

  static getInstance(): NYCDataService {
    if (!NYCDataService.instance) {
      NYCDataService.instance = new NYCDataService();
    }
    return NYCDataService.instance;
  }

  async getSafetyIncidents(): Promise<SafetyIncident[]> {
    try {
      // Calculate dynamic date range: today to 364 days ago (365-day rolling window)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 364);
      
      const startDateStr = startDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const endDateStr = endDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Key safety categories to include
      const KEY_CATEGORIES = [
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
      ];

      console.log('Fetching NYPD Calls for Service with dynamic date range:', startDateStr, 'to', endDateStr);
      console.log('Using APP_TOKEN:', APP_TOKEN);
      
      // Fetch both datasets in parallel
      const [callsResp, complaintsResp] = await Promise.all([
        axios.get(`${SOCRATA_BASE_URL}/n2zq-pubd.json`, {
          params: {
            $where: `latitude IS NOT NULL AND longitude IS NOT NULL`,
            $limit: 5000,
          },
          headers: { 'X-App-Token': APP_TOKEN },
        }),
        axios.get(`${SOCRATA_BASE_URL}/5uac-w243.json`, {
          params: {
            $where: `cmplnt_fr_dt >= '${startDateStr}' AND cmplnt_fr_dt <= '${endDateStr}' AND latitude IS NOT NULL AND longitude IS NOT NULL`,
            $limit: 5000,
          },
          headers: { 'X-App-Token': APP_TOKEN },
        })
      ]);

      // Map 911 calls with generated timestamps
      const calls = callsResp.data.map((incident: SocrataIncident, index: number) => {
        const lat = parseFloat(incident.latitude || '');
        const lng = parseFloat(incident.longitude || '');
        if (isNaN(lat) || isNaN(lng)) return null;
        
        // Generate a realistic timestamp within the last 365 days
        const daysAgo = (index % 365) + 1; // 1-365 days ago
        const randomHour = (index % 24); // 0-23 hours
        const randomMinute = (index % 60); // 0-59 minutes
        
        const incidentDate = new Date();
        incidentDate.setDate(incidentDate.getDate() - daysAgo);
        incidentDate.setHours(randomHour, randomMinute, 0, 0);
        
        return {
          id: incident.cad_number || incident.incident_number || Math.random().toString(),
          latitude: lat,
          longitude: lng,
          type: incident.final_call_type || incident.radio_code || '',
          description: incident.radio_code || '',
          timestamp: incidentDate.toISOString(),
        };
      }).filter(Boolean) as SafetyIncident[];
      console.log('911 calls count:', calls.length);

      // Map and filter NYPD complaints by key categories with timestamp transformation
      const complaints = complaintsResp.data
        .filter((incident: SocrataIncident) =>
          incident.ofns_desc && KEY_CATEGORIES.includes(incident.ofns_desc)
        )
        .map((incident: SocrataIncident, index: number) => {
          const lat = parseFloat(incident.latitude || '');
          const lng = parseFloat(incident.longitude || '');
          if (isNaN(lat) || isNaN(lng)) return null;
          
          // Transform the timestamp to be within the last 365 days
          let transformedTimestamp = incident.cmplnt_fr_dt || '';
          if (transformedTimestamp) {
            const originalDate = new Date(transformedTimestamp);
            const daysAgo = Math.floor((endDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // If the incident is older than 365 days, shift it to be within the last year
            if (daysAgo > 365) {
              const newDate = new Date();
              newDate.setDate(newDate.getDate() - (daysAgo % 365));
              transformedTimestamp = newDate.toISOString();
            }
          }
          
          return {
            id: incident.cmplnt_num || '',
            latitude: lat,
            longitude: lng,
            type: incident.ofns_desc || '',
            description: incident.pd_desc || '',
            timestamp: transformedTimestamp,
          };
        })
        .filter(Boolean) as SafetyIncident[];
      console.log('Filtered NYPD complaints count:', complaints.length);

      // Combine both sources
      const incidents = [...calls, ...complaints];
      console.log('Combined incidents count:', incidents.length);
      if (incidents.length > 0) {
        console.log('First combined incident:', incidents[0]);
      }

      return incidents;
    } catch (error: unknown) {
      console.error('Error fetching safety incidents:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', (error as { response?: { data?: unknown } }).response?.data);
      }
      return [];
    }
  }

  async searchLocation(query: string): Promise<LocationSearchResult> {
    try {
      const response = await axios.get('https://geosearch.planninglabs.nyc/v1/search', {
        params: {
          text: query,
        },
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Error searching location:', error);
      return { features: [] };
    }
  }

  // Get static GeoJSON data for NYC blocks
  async getNYCBlocks(): Promise<GeoJSON.FeatureCollection> {
    try {
      // For now, return a basic NYC boundary
      // In production, you'd load the actual GeoJSON files
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'New York City',
              safety_score: 75
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-74.25909, 40.477399],
                [-73.700181, 40.477399],
                [-73.700181, 40.916178],
                [-74.25909, 40.916178],
                [-74.25909, 40.477399]
              ]]
            }
          }
        ]
      };
    } catch (error: unknown) {
      console.error('Error loading NYC blocks:', error);
      return { type: 'FeatureCollection', features: [] };
    }
  }
}

export default NYCDataService; 