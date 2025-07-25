import { config } from '../config/config';

export interface Cluster {
  cluster_id: number;
  centroid: [number, number]; // [latitude, longitude]
  size: number;
  severity_score: number;
  incident_types: Record<string, number>;
  date_range: {
    start: string | null;
    end: string | null;
  };
}

export interface ClusteringData {
  clusters: Cluster[];
  metadata: {
    total_incidents: number;
    total_clusters: number;
    noise_points: number;
    generated_at: string;
    parameters: Record<string, any>;
  };
}

class ClusteringService {
  private static instance: ClusteringService;
  private clusteringData: ClusteringData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): ClusteringService {
    if (!ClusteringService.instance) {
      ClusteringService.instance = new ClusteringService();
    }
    return ClusteringService.instance;
  }

  async getClusteringData(): Promise<ClusteringData> {
    // Check if we have cached data that's still fresh
    const now = Date.now();
    if (this.clusteringData && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.clusteringData;
    }

    try {
      // For now, we'll use a sample clustering result
      // In production, this would be served from an API endpoint
      const response = await fetch('/api/clustering-data');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.clusteringData = data;
      this.lastFetch = now;
      
      return data;
    } catch (error) {
      console.error('Error fetching clustering data:', error);
      
      // Fallback to sample data for development
      return this.getSampleClusteringData();
    }
  }

  private getSampleClusteringData(): ClusteringData {
    // Sample clustering data based on our latest run
    return {
      clusters: [
        {
          cluster_id: 0,
          centroid: [40.60327190437086, -74.06747042069114],
          size: 5,
          severity_score: 8.0,
          incident_types: {
            "FELONY ASSAULT": 5
          },
          date_range: {
            start: "2024-08-11",
            end: "2024-09-08"
          }
        },
        {
          cluster_id: 1,
          centroid: [40.58309908066666, -74.161089972],
          size: 45,
          severity_score: 6.0,
          incident_types: {
            "ASSAULT 3 & RELATED OFFENSES": 37,
            "BURGLARY": 8
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-29"
          }
        },
        {
          cluster_id: 2,
          centroid: [40.576177983164555, -74.16058986848103],
          size: 79,
          severity_score: 3.0,
          incident_types: {
            "HARRASSMENT 2": 65,
            "CRIMINAL TRESPASS": 14
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-30"
          }
        },
        {
          cluster_id: 3,
          centroid: [40.668139745, -74.04453011160714],
          size: 56,
          severity_score: 7.0,
          incident_types: {
            "ROBBERY": 29,
            "DANGEROUS WEAPONS": 27
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-29"
          }
        },
        {
          cluster_id: 4,
          centroid: [40.6416717811015, -74.08292536893208],
          size: 65,
          severity_score: 8.06,
          incident_types: {
            "FELONY ASSAULT": 39,
            "SEX CRIMES": 22,
            "RAPE": 4
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-30"
          }
        }
      ],
      metadata: {
        total_incidents: 7196,
        total_clusters: 46,
        noise_points: 17,
        generated_at: "2025-07-25T11:22:08.548083",
        parameters: {
          min_cluster_size: 5,
          min_samples: 3,
          cluster_selection_epsilon: 0.1
        }
      }
    };
  }

  getClusterColor(severityScore: number): string {
    if (severityScore >= 8) {
      return '#dc2626'; // Red - High severity
    } else if (severityScore >= 6) {
      return '#ea580c'; // Orange - Medium-high severity
    } else if (severityScore >= 4) {
      return '#d97706'; // Amber - Medium severity
    } else {
      return '#6b7280'; // Gray - Low severity
    }
  }

  getClusterSize(size: number): number {
    // Scale cluster size for visualization
    const baseSize = 8;
    const maxSize = 24;
    const scale = Math.min(size / 100, 1); // Normalize to 0-1
    return baseSize + (scale * (maxSize - baseSize));
  }
}

export default ClusteringService; 