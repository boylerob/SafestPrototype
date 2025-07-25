import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the clustering output directory
    const clusteringOutputPath = path.join(process.cwd(), '..', 'backend-clustering', 'output');
    
    // Find the most recent cluster centroids file
    const files = fs.readdirSync(clusteringOutputPath);
    const centroidFiles = files.filter(file => file.startsWith('cluster_centroids_'));
    
    if (centroidFiles.length === 0) {
      return NextResponse.json(
        { error: 'No clustering data found. Please run the clustering pipeline first.' },
        { status: 404 }
      );
    }
    
    // Sort by timestamp and get the most recent
    centroidFiles.sort().reverse();
    const latestFile = centroidFiles[0];
    const filePath = path.join(clusteringOutputPath, latestFile);
    
    // Read and parse the clustering data
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const clusteringData = JSON.parse(fileContent);
    
    console.log(`Serving clustering data from: ${latestFile}`);
    console.log(`Total clusters: ${clusteringData.clusters.length}`);
    console.log(`Total incidents: ${clusteringData.metadata.total_incidents}`);
    
    return NextResponse.json(clusteringData);
    
  } catch (error) {
    console.error('Error reading clustering data:', error);
    return NextResponse.json(
      { error: 'Failed to load clustering data' },
      { status: 500 }
    );
  }
} 