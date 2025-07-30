'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { config } from '../config/config';
import ClusteringService, { ClusteringData } from '../services/clusteringService';
import GeoJSONService, { GeoJSONClusteringData } from '../services/geojsonService';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || config.mapbox.accessToken;

interface SafetyMapProps {
  className?: string;
}

const SafetyMap: React.FC<SafetyMapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clusteringData, setClusteringData] = useState<ClusteringData | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJSONClusteringData | null>(null);
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
      attributionControl: false,
      projection: 'mercator' // Explicitly set projection to Web Mercator
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
        const geojsonService = GeoJSONService.getInstance();
        
        const data = await clusteringService.getClusteringData();
        setClusteringData(data);
        
        // Convert to GeoJSON format
        const geojsonData = geojsonService.convertClusteringDataToGeoJSON(data);
        setGeojsonData(geojsonData);
        
        // Add GeoJSON source to map
        if (geojsonData.features.length > 0) {
          map.current!.addSource('clusters', {
            type: 'geojson',
            data: geojsonData
          });

          // Add cluster layer
          map.current!.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'clusters',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'size'],
                0, 10,
                100, 30
              ],
              'circle-color': [
                'case',
                ['>=', ['get', 'severity_score'], 8], '#dc2626',
                ['>=', ['get', 'severity_score'], 6], '#ea580c',
                ['>=', ['get', 'severity_score'], 4], '#ca8a04',
                ['>=', ['get', 'severity_score'], 2], '#16a34a',
                '#0891b2'
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });

          // Add click handler for clusters
          map.current!.on('click', 'clusters', (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0];
              const properties = feature.properties;
              
              if (properties) {
                const incidentTypesList = Object.entries(properties.incident_types)
                  .map(([type, count]) => `${type}: ${count}`)
                  .join('<br>');

                const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                  <div class="p-4 max-w-sm">
                    <h3 class="font-bold text-lg mb-2">Safety Cluster #${properties.cluster_id}</h3>
                    <div class="space-y-2 text-sm">
                      <p><strong>Size:</strong> ${properties.size} incidents</p>
                      <p><strong>Severity:</strong> ${properties.severity_score.toFixed(1)}/10</p>
                      <p><strong>Incident Types:</strong></p>
                      <div class="text-xs text-gray-600 ml-2">${incidentTypesList}</div>
                      ${properties.date_range ? `<p><strong>Date Range:</strong> ${properties.date_range.start} to ${properties.date_range.end}</p>` : ''}
                    </div>
                  </div>
                `);

                popup.setLngLat(e.lngLat).addTo(map.current!);
              }
            }
          });

          // Change cursor on hover
          map.current!.on('mouseenter', 'clusters', () => {
            map.current!.getCanvas().style.cursor = 'pointer';
          });

          map.current!.on('mouseleave', 'clusters', () => {
            map.current!.getCanvas().style.cursor = '';
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