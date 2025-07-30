'use client'

import { DataLayer } from '../../app/page'

interface DataToggleProps {
  activeLayer: DataLayer
  onLayerChange: (layer: DataLayer) => void
}

const DataToggle: React.FC<DataToggleProps> = ({ activeLayer, onLayerChange }) => {
  const layers = [
    {
      id: 'all-incidents' as DataLayer,
      label: 'All Incidents',
      description: 'View every individual incident'
    },
    {
      id: 'historical-clusters' as DataLayer,
      label: 'Historical Clusters',
      description: 'View safety clusters from historical data'
    },
    {
      id: 'predictive-clusters' as DataLayer,
      label: 'Predictive Clusters',
      description: 'View predicted safety hotspots (Coming Soon)'
    }
  ]

  return (
    <div className="data-toggle">
      <h3 className="font-semibold text-sm mb-3">Data Layers</h3>
      <div className="space-y-2">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            className={`toggle-button w-full text-left ${
              activeLayer === layer.id ? 'active' : 'inactive'
            }`}
            disabled={layer.id === 'predictive-clusters'}
          >
            <div className="font-medium">{layer.label}</div>
            <div className="text-xs opacity-75">{layer.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default DataToggle 