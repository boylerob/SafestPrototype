import axios from 'axios';

const SOCRATA_BASE_URL = 'https://data.cityofnewyork.us/resource';
const APP_TOKEN = process.env.SOCRATA_APP_TOKEN;

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
      const response = await axios.get(`${SOCRATA_BASE_URL}/erm2-nwe9.json`, {
        params: {
          $where: `within_circle(location, ${region.latitude}, ${region.longitude}, ${region.latitudeDelta * 111000})`,
          $limit: 100,
          agency: 'NYPD',
        },
        headers: {
          'X-App-Token': APP_TOKEN,
        },
      });

      return response.data.map((incident: any) => ({
        id: incident.unique_key,
        latitude: parseFloat(incident.latitude),
        longitude: parseFloat(incident.longitude),
        type: incident.complaint_type,
        description: incident.descriptor,
        timestamp: incident.created_date,
      }));
    } catch (error) {
      console.error('Error fetching safety incidents:', error);
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