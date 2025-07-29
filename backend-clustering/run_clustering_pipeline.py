#!/usr/bin/env python3
"""
NYC Safety Clustering Pipeline
Complete pipeline from data fetching to cluster analysis and export.
"""

import os
import sys
import json
from datetime import datetime
import logging
from typing import Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from data_fetcher import NYCSafetyDataFetcher
from hdbscan_cluster import HDBSCANClusterAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SafetyClusteringPipeline:
    """Complete pipeline for NYC safety data clustering"""
    
    def __init__(self):
        self.fetcher = NYCSafetyDataFetcher()
        self.cluster_analyzer = HDBSCANClusterAnalyzer()
        
        # Create output directory
        self.output_dir = os.path.join(os.path.dirname(__file__), 'output')
        os.makedirs(self.output_dir, exist_ok=True)
        
    def run_full_pipeline(self, 
                         min_cluster_size: int = 5,
                         min_samples: int = 3,
                         cluster_selection_epsilon: float = 0.1) -> Dict[str, Any]:
        """
        Run the complete clustering pipeline
        
        Args:
            min_cluster_size: Minimum size for a cluster
            min_samples: Minimum samples for core points
            cluster_selection_epsilon: Epsilon for cluster selection
            
        Returns:
            Dictionary with pipeline results and file paths
        """
        logger.info("🚀 Starting NYC Safety Clustering Pipeline")
        
        # Step 1: Fetch and process data
        logger.info("📊 Step 1: Fetching NYC safety data...")
        try:
            csv_file = self.fetcher.fetch_and_process()
            logger.info(f"✅ Data fetched and saved to: {csv_file}")
        except Exception as e:
            logger.error(f"❌ Error in data fetching: {e}")
            raise
        
        # Step 2: Run HDBSCAN clustering
        logger.info("🔍 Step 2: Running HDBSCAN clustering...")
        try:
            cluster_results = self.cluster_analyzer.run_hdbscan(
                csv_file,
                min_cluster_size=min_cluster_size,
                min_samples=min_samples,
                cluster_selection_epsilon=cluster_selection_epsilon
            )
            logger.info(f"✅ Clustering completed with {len(cluster_results['clusters'])} clusters")
        except Exception as e:
            logger.error(f"❌ Error in clustering: {e}")
            raise
        
        # Step 3: Export results
        logger.info("📤 Step 3: Exporting results...")
        try:
            output_files = self.export_results(cluster_results, csv_file)
            logger.info(f"✅ Results exported to: {output_files}")
        except Exception as e:
            logger.error(f"❌ Error in export: {e}")
            raise
        
        # Step 4: Generate summary report
        logger.info("📋 Step 4: Generating summary report...")
        try:
            summary = self.generate_summary(cluster_results, output_files)
            logger.info("✅ Summary report generated")
        except Exception as e:
            logger.error(f"❌ Error in summary generation: {e}")
            raise
        
        logger.info("🎉 Pipeline completed successfully!")
        return {
            'input_file': csv_file,
            'output_files': output_files,
            'summary': summary,
            'cluster_results': cluster_results
        }
    
    def export_results(self, cluster_results: Dict[str, Any], input_csv: str) -> Dict[str, str]:
        """Export clustering results in multiple formats"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Export cluster data as JSON for frontend
        clusters_json = os.path.join(self.output_dir, f'clusters_{timestamp}.json')
        with open(clusters_json, 'w') as f:
            json.dump(cluster_results, f, indent=2, default=self._json_serializer)
        
        # Export cluster centroids and metadata
        centroids_data = {
            'clusters': [],
            'metadata': {
                'total_incidents': len(cluster_results['data']),
                'total_clusters': len(cluster_results['clusters']),
                'noise_points': len(cluster_results['noise_points']),
                'generated_at': datetime.now().isoformat(),
                'parameters': cluster_results.get('parameters', {})
            }
        }
        
        for cluster_id, cluster_info in cluster_results['clusters'].items():
            centroids_data['clusters'].append({
                'cluster_id': cluster_id,
                'centroid': cluster_info['centroid'],
                'size': cluster_info['size'],
                'severity_score': cluster_info['avg_severity'],
                'incident_types': cluster_info['incident_types'],
                'date_range': cluster_info['date_range']
            })
        
        centroids_json = os.path.join(self.output_dir, f'cluster_centroids_{timestamp}.json')
        with open(centroids_json, 'w') as f:
            json.dump(centroids_data, f, indent=2, default=self._json_serializer)
        
        # Export noise points (outliers)
        noise_json = os.path.join(self.output_dir, f'noise_points_{timestamp}.json')
        with open(noise_json, 'w') as f:
            json.dump(cluster_results['noise_points'], f, indent=2, default=self._json_serializer)
        
        return {
            'clusters_full': clusters_json,
            'clusters_centroids': centroids_json,
            'noise_points': noise_json
        }
    
    def generate_summary(self, cluster_results: Dict[str, Any], output_files: Dict[str, str]) -> Dict[str, Any]:
        """Generate a summary report of the clustering results"""
        summary = {
            'pipeline_run_time': datetime.now().isoformat(),
            'data_summary': {
                'total_incidents': len(cluster_results['data']),
                'total_clusters': len(cluster_results['clusters']),
                'noise_points': len(cluster_results['noise_points']),
                'clustering_ratio': len(cluster_results['clusters']) / max(len(cluster_results['data']), 1)
            },
            'cluster_analysis': {
                'largest_cluster_size': max([c['size'] for c in cluster_results['clusters'].values()], default=0),
                'smallest_cluster_size': min([c['size'] for c in cluster_results['clusters'].values()], default=0),
                'avg_cluster_size': sum([c['size'] for c in cluster_results['clusters'].values()]) / max(len(cluster_results['clusters']), 1),
                'high_severity_clusters': len([c for c in cluster_results['clusters'].values() if c['avg_severity'] > 7])
            },
            'output_files': output_files,
            'recommendations': self.generate_recommendations(cluster_results)
        }
        
        # Save summary report
        summary_file = os.path.join(self.output_dir, f'pipeline_summary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=self._json_serializer)
        
        summary['summary_file'] = summary_file
        return summary
    
    def generate_recommendations(self, cluster_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate recommendations based on clustering results"""
        recommendations = {
            'high_priority_areas': [],
            'safety_insights': [],
            'data_quality_notes': []
        }
        
        # Identify high priority clusters (high severity, large size)
        high_priority = []
        for cluster_id, cluster_info in cluster_results['clusters'].items():
            priority_score = cluster_info['avg_severity'] * cluster_info['size']
            if priority_score > 50:  # Threshold for high priority
                high_priority.append({
                    'cluster_id': cluster_id,
                    'priority_score': priority_score,
                    'location': cluster_info['centroid'],
                    'severity': cluster_info['avg_severity'],
                    'size': cluster_info['size']
                })
        
        recommendations['high_priority_areas'] = sorted(high_priority, key=lambda x: x['priority_score'], reverse=True)[:5]
        
        # Generate safety insights
        if cluster_results['clusters']:
            avg_severity = sum([c['avg_severity'] for c in cluster_results['clusters'].values()]) / len(cluster_results['clusters'])
            recommendations['safety_insights'].append(f"Average cluster severity: {avg_severity:.2f}")
            recommendations['safety_insights'].append(f"Found {len(cluster_results['clusters'])} distinct safety hotspots")
        
        # Data quality notes
        noise_ratio = len(cluster_results['noise_points']) / max(len(cluster_results['data']), 1)
        if noise_ratio > 0.3:
            recommendations['data_quality_notes'].append(f"High noise ratio ({noise_ratio:.2%}) - consider adjusting clustering parameters")
        
        return recommendations
    
    def _json_serializer(self, obj):
        """Custom JSON serializer for numpy types and other non-serializable objects"""
        import numpy as np
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif hasattr(obj, 'isoformat'):
            return obj.isoformat()
        else:
            return str(obj)

def main():
    """Main entry point for the clustering pipeline"""
    pipeline = SafetyClusteringPipeline()
    
    try:
        results = pipeline.run_full_pipeline(
            min_cluster_size=15,      # Increased from 5 to require larger clusters
            min_samples=5,            # Increased from 3 to be more conservative
            cluster_selection_epsilon=0.05  # Decreased from 0.1 for tighter cluster selection
        )
        
        print("\n" + "="*60)
        print("🎉 PIPELINE COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"📊 Total incidents processed: {results['summary']['data_summary']['total_incidents']}")
        print(f"🔍 Clusters identified: {results['summary']['data_summary']['total_clusters']}")
        print(f"📈 Noise points: {results['summary']['data_summary']['noise_points']}")
        print(f"📁 Output files:")
        for file_type, file_path in results['output_files'].items():
            print(f"   - {file_type}: {file_path}")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 