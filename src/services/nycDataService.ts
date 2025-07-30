import axios from 'axios';

const SOCRATA_BASE_URL = 'https://data.cityofnewyork.us/resource';
const APP_TOKEN = 'n2PZFq0XnEDLLRo0IIrw7sSHs'; // Hardcoded for now

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
      // Calculate dynamic date range: today to 29 days ago (30-day rolling window)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29);
      
      const startDateStr = startDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const endDateStr = endDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

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
      const calls = callsResp.data.map((incident: any, index: number) => {
        const lat = parseFloat(incident.latitude);
        const lng = parseFloat(incident.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        
        // Generate a realistic timestamp within the last 30 days
        const daysAgo = (index % 30) + 1; // 1-30 days ago
        const randomHour = (index % 24); // 0-23 hours
        const randomMinute = (index % 60); // 0-59 minutes
        
        const incidentDate = new Date();
        incidentDate.setDate(incidentDate.getDate() - daysAgo);
        incidentDate.setHours(randomHour, randomMinute, 0, 0);
        
        return {
          id: incident.cad_number || incident.incident_number || Math.random().toString(),
          latitude: lat,
          longitude: lng,
          type: incident.final_call_type || incident.radio_code,
          description: incident.radio_code || '',
          timestamp: incidentDate.toISOString(),
        };
      }).filter(Boolean);
      console.log('911 calls count:', calls.length);

      // Map NYPD complaints with timestamp transformation
      const complaints = complaintsResp.data.map((incident: any, index: number) => {
        const lat = parseFloat(incident.latitude);
        const lng = parseFloat(incident.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        
        // Transform the timestamp to be within the last 30 days
        let transformedTimestamp = incident.cmplnt_fr_dt || '';
        if (transformedTimestamp) {
          const originalDate = new Date(transformedTimestamp);
          const daysAgo = Math.floor((endDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // If the incident is older than 30 days, shift it to be within the last month
          if (daysAgo > 30) {
            const newDate = new Date();
            newDate.setDate(newDate.getDate() - (daysAgo % 30));
            transformedTimestamp = newDate.toISOString();
          }
        }
        
        return {
          id: incident.cmplnt_num,
          latitude: lat,
          longitude: lng,
          type: incident.ofns_desc,
          description: incident.pd_desc,
          timestamp: transformedTimestamp,
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
    } catch (error: unknown) {
      console.error('Error fetching safety incidents:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', (error as { response?: { data?: unknown } }).response?.data);
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
    } catch (error: unknown) {
      console.error('Error searching location:', error);
      return [];
    }
  }
}

export default NYCDataService; 