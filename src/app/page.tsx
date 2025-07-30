'use client'

import { useState } from 'react'
import SafetyMapV2 from '../components/Map/SafetyMapV2'
import DataToggle from '../components/Controls/DataToggle'

export type DataLayer = 'all-incidents' | 'historical-clusters' | 'predictive-clusters'

export default function Home() {
  const [activeLayer, setActiveLayer] = useState<DataLayer>('all-incidents')

  return (
    <main className="h-screen w-full relative">
      <div className="absolute top-4 left-4 z-10">
        <DataToggle 
          activeLayer={activeLayer} 
          onLayerChange={setActiveLayer} 
        />
      </div>
      
      <SafetyMapV2 activeLayer={activeLayer} />
    </main>
  )
} 