#!/bin/bash

# Daily Safety Data Update Script
# This script runs the clustering pipeline daily to simulate real-time data updates

echo "🔄 Starting daily safety data update..."
echo "📅 Date: $(date)"

# Change to the backend-clustering directory
cd "$(dirname "$0")"

# Run the clustering pipeline
echo "🚀 Running clustering pipeline..."
python3 run_clustering_pipeline.py

# Check if the pipeline was successful
if [ $? -eq 0 ]; then
    echo "✅ Daily update completed successfully!"
    echo "📊 New data generated with dynamic date range"
    echo "🕐 Last updated: $(date)"
else
    echo "❌ Daily update failed!"
    exit 1
fi 