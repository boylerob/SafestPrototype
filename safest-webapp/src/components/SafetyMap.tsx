'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { config } from '../config/config';
import NYCDataService, { SafetyIncident } from '../services/nycDataService';

// Set Mapbox access token
mapboxgl.accessToken = config.mapbox.accessToken;

interface SafetyMapProps {
  className?: string;
}

const SafetyMap: React.FC<SafetyMapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
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

    // Load safety data when map is ready
    map.current.on('load', async () => {
      try {
        setLoading(true);
        const dataService = NYCDataService.getInstance();
        const safetyIncidents = await dataService.getSafetyIncidents();
        setIncidents(safetyIncidents);
        
        // Add safety incidents as markers
        if (safetyIncidents.length > 0) {
          safetyIncidents.forEach((incident) => {
            // Create marker element
            const markerEl = document.createElement('div');
            markerEl.className = 'safety-marker';
            markerEl.style.width = '12px';
            markerEl.style.height = '12px';
            markerEl.style.borderRadius = '50%';
            markerEl.style.backgroundColor = getIncidentColor(incident.type);
            markerEl.style.border = '2px solid white';
            markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            markerEl.style.cursor = 'pointer';

            // Create popup
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-3">
                <h3 class="font-bold text-sm mb-1">${incident.type}</h3>
                <p class="text-xs text-gray-600 mb-2">${incident.description}</p>
                <p class="text-xs text-gray-500">${new Date(incident.timestamp).toLocaleDateString()}</p>
              </div>
            `);

            // Add marker to map
            new mapboxgl.Marker(markerEl)
              .setLngLat([incident.longitude, incident.latitude])
              .setPopup(popup)
              .addTo(map.current!);
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading safety data:', err);
        setError('Failed to load safety data');
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

  const getIncidentColor = (type: string): string => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('assault') || typeLower.includes('robbery')) {
      return '#dc2626'; // Red
    } else if (typeLower.includes('theft') || typeLower.includes('larceny')) {
      return '#ea580c'; // Orange
    } else if (typeLower.includes('harassment') || typeLower.includes('stalking')) {
      return '#d97706'; // Amber
    } else {
      return '#6b7280'; // Gray
    }
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading safety data...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-10">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <h3 className="font-semibold text-sm mb-2">Safety Incidents</h3>
        <p className="text-xs text-gray-600">{incidents.length} incidents loaded</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>Assault/Robbery</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span>Theft/Larceny</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span>Harassment</span>
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