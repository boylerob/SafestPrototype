# Dynamic Data Update System

## Overview

This system simulates real-time safety data by using a **365-day rolling window** that updates daily. Instead of using static historical data, the system now fetches data from a dynamic date range that moves forward each day.

## How It Works

### Date Range Logic
- **Start Date**: 364 days ago from today
- **End Date**: Today
- **Result**: A rolling 365-day window that updates daily

### Data Transformation
1. **911 Calls**: Generate realistic timestamps within the last 365 days
2. **NYPD Complaints**: Transform existing timestamps to be within the last 365 days
3. **Daily Updates**: Each day, the window shifts forward by one day

## Implementation

### Backend Changes (`data_fetcher.py`)
```python
# Dynamic date range calculation
end_date = datetime.now()
start_date = end_date - timedelta(days=364)
start_date_str = start_date.strftime('%Y-%m-%d')
end_date_str = end_date.strftime('%Y-%m-%d')

# Timestamp transformation for complaints
if days_ago > 365:
    new_date = end_date - timedelta(days=days_ago % 365)
    transformed_timestamp = new_date.strftime('%Y-%m-%dT%H:%M:%S.%f')
```

### Frontend Changes (`nycDataService.ts`)
```typescript
// Dynamic date range calculation
const endDate = new Date();
const startDate = new Date();
startDate.setDate(endDate.getDate() - 364);

// Timestamp generation for 911 calls
const daysAgo = (index % 365) + 1;
const incidentDate = new Date();
incidentDate.setDate(incidentDate.getDate() - daysAgo);
```

## Benefits

1. **Simulated Real-time Data**: Data appears to update daily
2. **Realistic Timestamps**: All incidents have timestamps within the last year
3. **Consistent Data Volume**: Maintains similar incident counts
4. **No API Changes**: Uses existing Socrata endpoints
5. **Testing Ready**: Perfect for development and testing

## Usage

### Manual Update
```bash
cd backend-clustering
python3 run_clustering_pipeline.py
```

### Automated Daily Update
```bash
cd backend-clustering
./daily_update.sh
```

### Cron Job Setup (Optional)
```bash
# Add to crontab for daily updates at 2 AM
0 2 * * * /path/to/backend-clustering/daily_update.sh
```

## Data Flow

1. **Daily Trigger**: Script runs daily (manual or automated)
2. **Dynamic Fetching**: Fetches data from rolling 365-day window
3. **Timestamp Transformation**: Shifts old timestamps to be current
4. **Clustering Analysis**: Runs HDBSCAN on updated data
5. **Frontend Update**: Webapp displays fresh data

## Example Date Ranges

- **Day 1**: July 30, 2024 to July 30, 2025
- **Day 2**: July 31, 2024 to July 31, 2025
- **Day 3**: August 1, 2024 to August 1, 2025
- **...and so on**

## Monitoring

Check the logs to see the current date range:
```
Fetching data from 2024-07-31 to 2025-07-30
```

The date range will advance by one day each time the pipeline runs.

## Future Improvements

1. **Real-time APIs**: Replace with actual real-time data sources
2. **WebSocket Updates**: Real-time frontend updates
3. **Incremental Updates**: Only fetch new data since last update
4. **Data Validation**: Verify data quality and completeness 