import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import hdbscan
from typing import Dict, List, Any, Tuple
import json
from datetime import datetime


def load_data(csv_path):
    """Load incident data from a CSV file into a DataFrame."""
    return pd.read_csv(csv_path)


def preprocess_data(df, feature_cols, categorical_cols=None):
    """Preprocess and normalize features for clustering."""
    X = df[feature_cols].copy()
    if categorical_cols:
        X = pd.get_dummies(X, columns=categorical_cols)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled


def run_hdbscan(X, min_cluster_size=30, metric='euclidean'):
    """Run HDBSCAN clustering and return labels and probabilities."""
    clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, metric=metric)
    labels = clusterer.fit_predict(X)
    probabilities = clusterer.probabilities_
    return labels, probabilities


def attach_cluster_results(df, labels, probabilities):
    """Attach cluster labels and probabilities to the DataFrame."""
    df = df.copy()
    df['cluster_id'] = labels
    df['membership_probability'] = probabilities
    return df


def export_to_json(df, output_path):
    """Export the DataFrame with cluster info to a JSON file."""
    df.to_json(output_path, orient='records')


class HDBSCANClusterAnalyzer:
    """Advanced HDBSCAN clustering analyzer for NYC safety data"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.clusterer = None
        
    def load_data(self, csv_path: str) -> pd.DataFrame:
        """Load incident data from CSV file"""
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} incidents from {csv_path}")
        return df
    
    def preprocess_data(self, df: pd.DataFrame) -> np.ndarray:
        """Preprocess data for clustering analysis"""
        # Select features for clustering
        feature_cols = ['latitude', 'longitude', 'severity_score']
        
        # Add temporal features if available
        if 'hour' in df.columns:
            feature_cols.append('hour')
        if 'month' in df.columns:
            feature_cols.append('month')
        
        # Create feature matrix
        X = df[feature_cols].copy()
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        print(f"Preprocessed {X_scaled.shape[0]} samples with {X_scaled.shape[1]} features")
        return X_scaled
    
    def run_hdbscan(self, 
                   csv_path: str,
                   min_cluster_size: int = 5,
                   min_samples: int = 3,
                   cluster_selection_epsilon: float = 0.1) -> Dict[str, Any]:
        """
        Run complete HDBSCAN clustering analysis
        
        Args:
            csv_path: Path to CSV file with incident data
            min_cluster_size: Minimum size for a cluster
            min_samples: Minimum samples for core points
            cluster_selection_epsilon: Epsilon for cluster selection
            
        Returns:
            Dictionary with clustering results
        """
        # Load data
        df = self.load_data(csv_path)
        
        # Preprocess data
        X_scaled = self.preprocess_data(df)
        
        # Run HDBSCAN
        self.clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cluster_size,
            min_samples=min_samples,
            cluster_selection_epsilon=cluster_selection_epsilon,
            metric='euclidean'
        )
        
        labels = self.clusterer.fit_predict(X_scaled)
        probabilities = self.clusterer.probabilities_
        
        # Attach results to dataframe
        df['cluster_id'] = labels
        df['membership_probability'] = probabilities
        
        # Analyze results
        results = self._analyze_clusters(df, labels, probabilities)
        
        return results
    
    def _analyze_clusters(self, df: pd.DataFrame, labels: np.ndarray, probabilities: np.ndarray) -> Dict[str, Any]:
        """Analyze clustering results and extract insights"""
        
        # Separate clusters and noise
        cluster_mask = labels >= 0
        noise_mask = labels == -1
        
        clusters = {}
        noise_points = []
        
        # Analyze each cluster
        for cluster_id in set(labels):
            cluster_id = int(cluster_id)  # Convert numpy int64 to regular int
            if cluster_id == -1:  # Noise points
                noise_indices = df[noise_mask].index.tolist()
                noise_points = df[noise_mask].to_dict('records')
                continue
                
            cluster_mask = labels == cluster_id
            cluster_data = df[cluster_mask]
            
            # Calculate cluster statistics
            centroid = [cluster_data['latitude'].mean(), cluster_data['longitude'].mean()]
            size = len(cluster_data)
            avg_severity = cluster_data['severity_score'].mean()
            
            # Get incident type distribution
            incident_types = cluster_data['type'].value_counts().to_dict()
            
            # Get date range
            if 'date' in cluster_data.columns:
                min_date = cluster_data['date'].min()
                max_date = cluster_data['date'].max()
                date_range = {
                    'start': min_date.isoformat() if pd.notna(min_date) and hasattr(min_date, 'isoformat') else str(min_date) if pd.notna(min_date) else None,
                    'end': max_date.isoformat() if pd.notna(max_date) and hasattr(max_date, 'isoformat') else str(max_date) if pd.notna(max_date) else None
                }
            else:
                date_range = {'start': None, 'end': None}
            
            clusters[cluster_id] = {
                'centroid': centroid,
                'size': size,
                'avg_severity': avg_severity,
                'incident_types': incident_types,
                'date_range': date_range,
                'members': cluster_data.to_dict('records')
            }
        
        # Prepare results
        results = {
            'data': df.to_dict('records'),
            'clusters': clusters,
            'noise_points': noise_points,
            'parameters': {
                'min_cluster_size': self.clusterer.min_cluster_size,
                'min_samples': self.clusterer.min_samples,
                'cluster_selection_epsilon': self.clusterer.cluster_selection_epsilon
            },
            'summary': {
                'total_incidents': len(df),
                'total_clusters': len(clusters),
                'noise_points': len(noise_points),
                'clustering_ratio': len(clusters) / max(len(df), 1)
            }
        }
        
        return results


if __name__ == "__main__":
    # Example usage
    # 1. Load data
    df = load_data('incidents.csv')

    # 2. Preprocess (example: latitude, longitude, severity)
    features = ['latitude', 'longitude']
    if 'severity' in df.columns:
        features.append('severity')
    X = preprocess_data(df, features)

    # 3. Run HDBSCAN
    labels, probabilities = run_hdbscan(X, min_cluster_size=30)

    # 4. Attach results
    df_clustered = attach_cluster_results(df, labels, probabilities)

    # 5. Export
    export_to_json(df_clustered, 'incidents_with_clusters.json') 