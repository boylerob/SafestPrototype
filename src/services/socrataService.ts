export interface SocrataIncident {
  id: string
  latitude: number
  longitude: number
  type: string
  description: string
  timestamp: string
  source: '911_calls' | 'nypd_complaints'
  severity_score: number
}

export interface SocrataResponse {
  incidents: SocrataIncident[]
  total: number
  metadata: {
    last_updated: string
    source: string
  }
}

class SocrataService {
  private static instance: SocrataService
  private baseUrl: string

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  }

  static getInstance(): SocrataService {
    if (!SocrataService.instance) {
      SocrataService.instance = new SocrataService()
    }
    return SocrataService.instance
  }

  async fetchAllIncidents(): Promise<SocrataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/socrata-incidents`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching Socrata incidents:', error)
      throw error
    }
  }

  getIncidentColor(severityScore: number): string {
    if (severityScore >= 8) return '#ef4444' // red-500
    if (severityScore >= 6) return '#f97316' // orange-500
    if (severityScore >= 4) return '#f59e0b' // amber-500
    return '#6b7280' // gray-500
  }

  getIncidentSize(severityScore: number): number {
    if (severityScore >= 8) return 8
    if (severityScore >= 6) return 6
    if (severityScore >= 4) return 4
    return 3
  }
}

export default SocrataService 