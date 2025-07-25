# NYC Safety Data Clustering Backend

This module provides a complete Python pipeline for fetching NYC safety data, performing HDBSCAN clustering analysis, and exporting results for frontend visualization.

## 🏗️ Architecture

```
backend-clustering/
├── data_fetcher.py          # Fetches data from Socrata API
├── hdbscan_cluster.py       # HDBSCAN clustering analysis
├── run_clustering_pipeline.py # Complete pipeline orchestration
├── requirements.txt         # Python dependencies
├── data/                   # Raw CSV data (auto-created)
├── output/                 # Clustering results (auto-created)
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend-clustering
pip install -r requirements.txt
```

### 2. Run the Complete Pipeline

```bash
python run_clustering_pipeline.py
```

This will:
- Fetch NYC safety data from Socrata API
- Apply filtering (key safety categories)
- Run HDBSCAN clustering analysis
- Export results to JSON files
- Generate summary reports

## 📊 Data Sources

### NYPD Calls for Service (911 Calls)
- **Dataset ID:** `n2zq-pubd`
- **Filter:** All calls with valid coordinates
- **Limit:** 5,000 records

### NYPD Complaints
- **Dataset ID:** `5uac-w243`
- **Filter:** Last 1 year + key safety categories + valid coordinates
- **Limit:** 5,000 records

### Key Safety Categories
- ASSAULT 3 & RELATED OFFENSES
- FELONY ASSAULT
- ROBBERY
- BURGLARY
- GRAND LARCENY
- GRAND LARCENY OF MOTOR VEHICLE
- SEX CRIMES
- RAPE
- MURDER & NON-NEGL. MANSLAUGHTER
- DANGEROUS WEAPONS
- DANGEROUS DRUGS
- HARRASSMENT 2
- CRIMINAL TRESPASS
- KIDNAPPING & RELATED OFFENSES
- ARSON

## 🔍 Clustering Analysis

### HDBSCAN Parameters
- **min_cluster_size:** 5 (minimum points per cluster)
- **min_samples:** 3 (minimum samples for core points)
- **cluster_selection_epsilon:** 0.1 (epsilon for cluster selection)

### Features Used for Clustering
- **Geographic:** latitude, longitude
- **Temporal:** hour, day_of_week, month
- **Categorical:** incident type, source
- **Severity:** severity_score (1-10 scale)

## 📤 Output Files

The pipeline generates several output files in the `output/` directory:

### 1. `clusters_YYYYMMDD_HHMMSS.json`
Complete clustering results including:
- All incident data with cluster assignments
- Cluster metadata and statistics
- Noise points (outliers)

### 2. `cluster_centroids_YYYYMMDD_HHMMSS.json`
Simplified cluster data for frontend:
- Cluster centroids (lat/lng)
- Cluster sizes and severity scores
- Incident type distributions
- Date ranges

### 3. `noise_points_YYYYMMDD_HHMMSS.json`
Outlier incidents that don't belong to any cluster

### 4. `pipeline_summary_YYYYMMDD_HHMMSS.json`
Pipeline execution summary:
- Data statistics
- Clustering performance metrics
- Recommendations and insights

## 🔧 Configuration

### API Configuration
Edit `data_fetcher.py` to modify:
- Socrata API token
- Data source URLs
- Filtering criteria

### Clustering Parameters
Edit `run_clustering_pipeline.py` to adjust:
- `min_cluster_size`
- `min_samples`
- `cluster_selection_epsilon`

## 📈 Integration with Frontend

### For Mapbox Integration
Use `cluster_centroids_*.json` for:
- Cluster visualization as map markers
- Color coding by severity score
- Popup information display

### For Analytics Dashboard
Use `pipeline_summary_*.json` for:
- High-level statistics
- Trend analysis
- Performance metrics

## 🛠️ Development

### Running Individual Components

```bash
# Just fetch data
python data_fetcher.py

# Just run clustering on existing CSV
python hdbscan_cluster.py data/your_file.csv
```

### Custom Analysis

```python
from data_fetcher import NYCSafetyDataFetcher
from hdbscan_cluster import HDBSCANClusterAnalyzer

# Fetch data
fetcher = NYCSafetyDataFetcher()
csv_file = fetcher.fetch_and_process()

# Run clustering
analyzer = HDBSCANClusterAnalyzer()
results = analyzer.run_hdbscan(csv_file, min_cluster_size=10)
```

## 📊 Performance Considerations

### Data Volume
- Current limit: 5,000 records per dataset
- Processing time: ~30-60 seconds for full pipeline
- Memory usage: ~100-200MB for typical datasets

### Scalability
- Can handle up to 50,000 records with current setup
- For larger datasets, consider:
  - Database storage
  - Batch processing
  - Cloud deployment

## 🔒 Security

### API Keys
- Socrata app token is included in code (public data)
- For production, move to environment variables

### Data Privacy
- All data is publicly available NYC open data
- No PII (Personally Identifiable Information) processed

## 🐛 Troubleshooting

### Common Issues

1. **API Rate Limiting**
   - Socrata has rate limits
   - Add delays between requests if needed

2. **Memory Issues**
   - Reduce data limits
   - Process in smaller batches

3. **Clustering Quality**
   - Adjust HDBSCAN parameters
   - Check data quality and filtering

### Debug Mode
Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 Future Enhancements

### Planned Features
- [ ] Real-time data updates
- [ ] Predictive modeling integration
- [ ] Interactive parameter tuning
- [ ] Cloud deployment (Google Cloud Functions)
- [ ] Database integration (Cloud SQL)

### Potential Improvements
- [ ] Additional clustering algorithms
- [ ] Temporal pattern analysis
- [ ] Geographic boundary integration
- [ ] Machine learning for incident prediction

## 🤝 Contributing

1. Follow Python PEP 8 style guidelines
2. Add type hints to all functions
3. Include docstrings for all classes and methods
4. Test with sample data before committing

## 📄 License

This module is part of the Safest Prototype project. 