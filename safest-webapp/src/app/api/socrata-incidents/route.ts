import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface IncidentData {
  [key: string]: string | number
}

export async function GET() {
  try {
    // Read the latest CSV file from backend-clustering/data
    const backendDataDir = path.join(process.cwd(), '..', 'backend-clustering', 'data')
    
    console.log('Looking for data files in:', backendDataDir)
    
    // Find the most recent CSV file
    const files = fs.readdirSync(backendDataDir)
    const csvFiles = files.filter(file => file.endsWith('.csv') && file.includes('nyc_safety_incidents'))
    
    console.log('Found CSV files:', csvFiles)
    
    if (csvFiles.length === 0) {
      return NextResponse.json({ 
        error: 'No incident data files found' 
      }, { status: 404 })
    }
    
    // Sort by modification time and get the most recent
    const latestFile = csvFiles
      .map(file => ({
        name: file,
        mtime: fs.statSync(path.join(backendDataDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].name
    
    console.log('Selected file:', latestFile)
    
    const filePath = path.join(backendDataDir, latestFile)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    // Parse CSV and convert to JSON
    const lines = fileContent.split('\n')
    const headers = lines[0].split(',')
    const incidents = []
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',')
        const incident: IncidentData = {}
        
        headers.forEach((header, index) => {
          incident[header.trim()] = values[index]?.trim() || ''
        })
        
        // Convert numeric fields
        if (incident.latitude && incident.longitude) {
          incident.latitude = parseFloat(incident.latitude as string)
          incident.longitude = parseFloat(incident.longitude as string)
        }
        if (incident.severity_score) {
          incident.severity_score = parseInt(incident.severity_score as string)
        }
        
        incidents.push(incident)
      }
    }
    
    console.log('Loaded incidents:', incidents.length)
    console.log('Sample incident:', incidents[0])
    
    return NextResponse.json({
      incidents,
      total: incidents.length,
      metadata: {
        last_updated: new Date().toISOString(),
        source: 'Socrata API',
        file: latestFile
      }
    })
    
  } catch (error) {
    console.error('Error reading incident data:', error)
    return NextResponse.json({ 
      error: 'Failed to load incident data' 
    }, { status: 500 })
  }
} 