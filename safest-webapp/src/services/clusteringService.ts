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

    try {
      // Fetch real clustering data from our API
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
      throw error;
    }
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