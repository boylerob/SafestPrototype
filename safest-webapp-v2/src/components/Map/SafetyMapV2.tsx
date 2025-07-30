'use client'

import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { DataLayer } from '../../app/page'
import { config } from '../../config/config'

interface SafetyMapV2Props {
  activeLayer: DataLayer
}

const SafetyMapV2: React.FC<SafetyMapV2Props> = ({ activeLayer }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        // TODO: Add all incidents layer
        console.log('Loading all incidents...')
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
  }, [activeLayer])

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