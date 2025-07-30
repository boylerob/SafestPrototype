import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Safest NYC v2 API is working!',
    version: '2.0.0',
    features: ['all-incidents', 'historical-clusters', 'predictive-clusters']
  })
} 