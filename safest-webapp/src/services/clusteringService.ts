// Removed unused import

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
    parameters: Record<string, unknown>;
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

    // For now, use sample clustering data directly
    // In production, this would be served from an API endpoint
    const data = this.getSampleClusteringData();
    this.clusteringData = data;
    this.lastFetch = now;
    
    return data;
  }

  private getSampleClusteringData(): ClusteringData {
    // Sample clustering data based on our latest run
    return {
      clusters: [
        {
          cluster_id: 0,
          centroid: [40.7589, -73.9851], // Times Square area
          size: 150,
          severity_score: 8.5,
          incident_types: {
            "FELONY ASSAULT": 80,
            "ROBBERY": 45,
            "DANGEROUS WEAPONS": 25
          },
          date_range: {
            start: "2024-08-11",
            end: "2024-09-08"
          }
        },
        {
          cluster_id: 1,
          centroid: [40.7505, -73.9934], // Penn Station area
          size: 120,
          severity_score: 7.2,
          incident_types: {
            "ASSAULT 3 & RELATED OFFENSES": 60,
            "BURGLARY": 35,
            "GRAND LARCENY": 25
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-29"
          }
        },
        {
          cluster_id: 2,
          centroid: [40.7128, -74.0060], // Lower Manhattan
          size: 95,
          severity_score: 6.8,
          incident_types: {
            "ROBBERY": 50,
            "FELONY ASSAULT": 30,
            "DANGEROUS WEAPONS": 15
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-30"
          }
        },
        {
          cluster_id: 3,
          centroid: [40.7484, -73.9857], // Midtown West
          size: 85,
          severity_score: 7.5,
          incident_types: {
            "SEX CRIMES": 40,
            "FELONY ASSAULT": 25,
            "RAPE": 20
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-29"
          }
        },
        {
          cluster_id: 4,
          centroid: [40.7549, -73.9840], // Bryant Park area
          size: 110,
          severity_score: 6.2,
          incident_types: {
            "GRAND LARCENY": 60,
            "BURGLARY": 30,
            "HARRASSMENT 2": 20
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-30"
          }
        },
        {
          cluster_id: 5,
          centroid: [40.7614, -73.9776], // Grand Central area
          size: 75,
          severity_score: 8.1,
          incident_types: {
            "FELONY ASSAULT": 45,
            "ROBBERY": 20,
            "DANGEROUS WEAPONS": 10
          },
          date_range: {
            start: "2025-06-01",
            end: "2025-06-30"
          }
        }
      ],
      metadata: {
        total_incidents: 7196,
        total_clusters: 6,
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