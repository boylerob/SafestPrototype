'use client'

import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { DataLayer } from '../../app/page'
import { config } from '../../config/config'
import SocrataService, { SocrataIncident } from '../../services/socrataService'

interface SafetyMapV2Props {
  activeLayer: DataLayer
}

const SafetyMapV2: React.FC<SafetyMapV2Props> = ({ activeLayer }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<SocrataIncident[]>([])

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.006, 40.7128], // NYC coordinates
      zoom: 10,
      accessToken: config.mapboxAccessToken
    })

    map.current.on('load', () => {
      setLoading(false)
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  // Load incidents when activeLayer changes
  useEffect(() => {
    const loadIncidents = async () => {
      if (activeLayer === 'all-incidents') {
        try {
          const socrataService = SocrataService.getInstance()
          const response = await socrataService.fetchAllIncidents()
          setIncidents(response.incidents)
        } catch (error) {
          console.error('Error loading incidents:', error)
          setError('Failed to load incident data')
        }
      } else {
        setIncidents([])
      }
    }

    loadIncidents()
  }, [activeLayer])

  // Handle layer changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    // Remove existing layers
    if (map.current.getLayer('clusters')) {
      map.current.removeLayer('clusters')
    }
    if (map.current.getLayer('incidents')) {
      map.current.removeLayer('incidents')
    }
    if (map.current.getSource('clusters')) {
      map.current.removeSource('clusters')
    }
    if (map.current.getSource('incidents')) {
      map.current.removeSource('incidents')
    }

    // Add new layer based on activeLayer
    switch (activeLayer) {
      case 'all-incidents':
        if (incidents.length > 0) {
          addIncidentsLayer()
        }
        break
      case 'historical-clusters':
        // TODO: Add historical clusters layer
        console.log('Loading historical clusters...')
        break
      case 'predictive-clusters':
        // TODO: Add predictive clusters layer
        console.log('Loading predictive clusters...')
        break
    }
  }, [activeLayer, incidents])

  const addIncidentsLayer = () => {
    if (!map.current || incidents.length === 0) return

    const socrataService = SocrataService.getInstance()

    // Add incidents as GeoJSON source
    map.current.addSource('incidents', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: incidents.map(incident => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [incident.longitude, incident.latitude]
          },
          properties: {
            id: incident.id,
            type: incident.type,
            description: incident.description,
            severity_score: incident.severity_score,
            source: incident.source,
            timestamp: incident.timestamp
          }
        }))
      }
    })

    // Add incidents layer
    map.current.addLayer({
      id: 'incidents',
      type: 'circle',
      source: 'incidents',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'severity_score'],
          1, 3,
          10, 8
        ],
        'circle-color': [
          'case',
          ['>=', ['get', 'severity_score'], 8], '#ef4444',
          ['>=', ['get', 'severity_score'], 6], '#f97316',
          ['>=', ['get', 'severity_score'], 4], '#f59e0b',
          '#6b7280'
        ],
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    })

    // Add click handler for incidents
    map.current.on('click', 'incidents', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0]
        const properties = feature.properties
        
        if (properties) {
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-4 max-w-sm">
              <h3 class="font-bold text-lg mb-2">Safety Incident</h3>
              <div class="space-y-2 text-sm">
                <p><strong>Type:</strong> ${properties.type}</p>
                <p><strong>Severity:</strong> ${properties.severity_score}/10</p>
                <p><strong>Source:</strong> ${properties.source}</p>
                ${properties.description ? `<p><strong>Description:</strong> ${properties.description}</p>` : ''}
                ${properties.timestamp ? `<p><strong>Date:</strong> ${properties.timestamp}</p>` : ''}
              </div>
            </div>
          `)

          popup.setLngLat(e.lngLat).addTo(map.current!)
        }
      }
    })

    // Change cursor on hover
    map.current.on('mouseenter', 'incidents', () => {
      map.current!.getCanvas().style.cursor = 'pointer'
    })

    map.current.on('mouseleave', 'incidents', () => {
      map.current!.getCanvas().style.cursor = ''
    })
  }

  return (
    <div className="h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-10">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div 
        ref={mapContainer} 
        className="h-full w-full"
      />
    </div>
  )
}

export default SafetyMapV2 