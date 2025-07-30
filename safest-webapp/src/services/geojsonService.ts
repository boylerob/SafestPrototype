import { ClusteringData, Cluster } from './clusteringService';

export interface GeoJSONCluster {
  type: 'Feature';
  properties: {
    cluster_id: number;
    size: number;
    severity_score: number;
    incident_types: Record<string, number>;
    date_range?: {
      start: string;
      end: string;
    };
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude] - GeoJSON standard
  };
}

export interface GeoJSONClusteringData {
  type: 'FeatureCollection';
  features: GeoJSONCluster[];
}

class GeoJSONService {
  private static instance: GeoJSONService;

  private constructor() {}

  static getInstance(): GeoJSONService {
    if (!GeoJSONService.instance) {
      GeoJSONService.instance = new GeoJSONService();
    }
    return GeoJSONService.instance;
  }

  /**
   * Convert clustering data to GeoJSON format
   * @param clusteringData - The clustering data from the API
   * @returns GeoJSON formatted clustering data
   */
  convertClusteringDataToGeoJSON(clusteringData: ClusteringData): GeoJSONClusteringData {
    const features: GeoJSONCluster[] = clusteringData.clusters.map((cluster: Cluster) => {
      return {
        type: 'Feature',
        properties: {
          cluster_id: cluster.cluster_id,
          size: cluster.size,
          severity_score: cluster.severity_score,
          incident_types: cluster.incident_types,
          date_range: cluster.date_range.start && cluster.date_range.end ? {
            start: cluster.date_range.start,
            end: cluster.date_range.end
          } : undefined
        },
        geometry: {
          type: 'Point',
          coordinates: [
            cluster.centroid[1], // longitude (second element)
            cluster.centroid[0]  // latitude (first element)
          ]
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Validate GeoJSON coordinates are within NYC bounds
   * @param coordinates - [longitude, latitude] coordinates
   * @returns boolean indicating if coordinates are valid
   */
  validateNYCCoordinates(coordinates: [number, number]): boolean {
    const [longitude, latitude] = coordinates;
    
    // NYC bounds: approximately -74.259 to -73.700 longitude, 40.477 to 40.916 latitude
    const nycBounds = {
      minLng: -74.259,
      maxLng: -73.700,
      minLat: 40.477,
      maxLat: 40.916
    };

    return (
      longitude >= nycBounds.minLng &&
      longitude <= nycBounds.maxLng &&
      latitude >= nycBounds.minLat &&
      latitude <= nycBounds.maxLat
    );
  }

  /**
   * Get cluster color based on severity score
   * @param severityScore - The severity score (0-10)
   * @returns CSS color string
   */
  getClusterColor(severityScore: number): string {
    if (severityScore >= 8) return '#dc2626'; // Red for high severity
    if (severityScore >= 6) return '#ea580c'; // Orange for medium-high severity
    if (severityScore >= 4) return '#ca8a04'; // Yellow for medium severity
    if (severityScore >= 2) return '#16a34a'; // Green for low-medium severity
    return '#0891b2'; // Blue for low severity
  }

  /**
   * Get cluster size based on incident count
   * @param size - Number of incidents in cluster
   * @returns Size in pixels
   */
  getClusterSize(size: number): number {
    if (size >= 100) return 40;
    if (size >= 50) return 35;
    if (size >= 25) return 30;
    if (size >= 10) return 25;
    return 20;
  }
}

export default GeoJSONService; 