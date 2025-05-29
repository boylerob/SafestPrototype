import axios from 'axios';
import { config } from '../config/config';

const SOCRATA_BASE_URL = 'https://data.cityofnewyork.us/resource';
const APP_TOKEN = config.socrata.appToken;

interface SafetyIncident {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string;
  timestamp: string;
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

  async getSafetyIncidents(region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }): Promise<SafetyIncident[]> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const socrataDate = oneYearAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      console.log('Fetching NYPD Calls for Service (Year to Date) from date:', socrataDate);
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
            $where: `cmplnt_fr_dt >= '${socrataDate}' AND latitude IS NOT NULL AND longitude IS NOT NULL`,
            $limit: 5000,
          },
          headers: { 'X-App-Token': APP_TOKEN },
        })
      ]);

      // Map 911 calls
      const calls = callsResp.data.map((incident: any) => {
        const lat = parseFloat(incident.latitude);
        const lng = parseFloat(incident.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        return {
          id: incident.cad_number || incident.incident_number || Math.random().toString(),
          latitude: lat,
          longitude: lng,
          type: incident.final_call_type || incident.radio_code,
          description: incident.radio_code || '',
          timestamp: incident.entry_date_time || incident.dispatch_date_time || '',
        };
      }).filter(Boolean);
      console.log('911 calls count:', calls.length);

      // Map NYPD complaints
      const complaints = complaintsResp.data.map((incident: any) => {
        const lat = parseFloat(incident.latitude);
        const lng = parseFloat(incident.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        return {
          id: incident.cmplnt_num,
          latitude: lat,
          longitude: lng,
          type: incident.ofns_desc,
          description: incident.pd_desc,
          timestamp: incident.cmplnt_fr_dt,
        };
      }).filter(Boolean);
      console.log('NYPD complaints count:', complaints.length);

      // Combine both sources
      const incidents = [...calls, ...complaints];
      console.log('Combined incidents count:', incidents.length);
      if (incidents.length > 0) {
        console.log('First combined incident:', incidents[0]);
      }

      return incidents;
    } catch (error) {
      console.error('Error fetching safety incidents:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return [];
    }
  }

  async searchLocation(query: string) {
    try {
      const response = await axios.get('https://geosearch.planninglabs.nyc/v1/search', {
        params: {
          text: query,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching location:', error);
      return [];
    }
  }
}

export default NYCDataService; 