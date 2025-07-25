'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { config } from '../config/config';
import ClusteringService, { Cluster, ClusteringData } from '../services/clusteringService';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || config.mapbox.accessToken;

interface SafetyMapProps {
  className?: string;
}

const SafetyMap: React.FC<SafetyMapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clusteringData, setClusteringData] = useState<ClusteringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.935242, 40.730610], // NYC center
      zoom: 10,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Load clustering data when map is ready
    map.current.on('load', async () => {
      try {
        setLoading(true);
        const clusteringService = ClusteringService.getInstance();
        const data = await clusteringService.getClusteringData();
        setClusteringData(data);
        
        // Add cluster markers
        if (data.clusters.length > 0) {
          data.clusters.forEach((cluster) => {
            // Create marker element
            const markerEl = document.createElement('div');
            markerEl.className = 'cluster-marker';
            markerEl.style.width = `${clusteringService.getClusterSize(cluster.size)}px`;
            markerEl.style.height = `${clusteringService.getClusterSize(cluster.size)}px`;
            markerEl.style.borderRadius = '50%';
            markerEl.style.backgroundColor = clusteringService.getClusterColor(cluster.severity_score);
            markerEl.style.border = '3px solid white';
            markerEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            markerEl.style.cursor = 'pointer';
            markerEl.style.opacity = '0.8';

            // Create popup content
            const incidentTypesList = Object.entries(cluster.incident_types)
              .map(([type, count]) => `${type}: ${count}`)
              .join('<br>');

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-4 max-w-sm">
                <h3 class="font-bold text-lg mb-2">Safety Cluster #${cluster.cluster_id}</h3>
                <div class="space-y-2 text-sm">
                  <p><strong>Size:</strong> ${cluster.size} incidents</p>
                  <p><strong>Severity:</strong> ${cluster.severity_score.toFixed(1)}/10</p>
                  <p><strong>Incident Types:</strong></p>
                  <div class="text-xs text-gray-600 ml-2">${incidentTypesList}</div>
                  ${cluster.date_range.start ? `<p><strong>Date Range:</strong> ${cluster.date_range.start} to ${cluster.date_range.end}</p>` : ''}
                </div>
              </div>
            `);

            // Add marker to map
            new mapboxgl.Marker(markerEl)
              .setLngLat([cluster.centroid[1], cluster.centroid[0]]) // Note: centroid is [lat, lng] but Mapbox expects [lng, lat]
              .setPopup(popup)
              .addTo(map.current!);
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading clustering data:', err);
        setError('Failed to load clustering data');
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading safety clusters...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-10">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <h3 className="font-semibold text-sm mb-2">Safety Clusters</h3>
        <p className="text-xs text-gray-600">
          {clusteringData ? `${clusteringData.metadata.total_clusters} clusters from ${clusteringData.metadata.total_incidents} incidents` : 'Loading...'}
        </p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>High Severity (8-10)</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span>Medium-High (6-7)</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span>Medium (4-5)</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
            <span>Low (1-3)</span>
          </div>
        </div>
      </div>

      <div 
        ref={mapContainer} 
        className="w-full h-full min-h-[600px]"
      />
    </div>
  );
};

export default SafetyMap; 