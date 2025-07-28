# Implementing SARIMA Forecasting for Public Safety Clusters

## Project Context

You already have:

- A backend system built with **Cursor** that ingests and pipes safety data.
- A **Vercel-hosted frontend** displaying the data.
- **HDBSCAN** clustering successfully implemented to visualize safety zones.

This document outlines how to integrate **SARIMA** (Seasonal AutoRegressive Integrated Moving Average) to **forecast safety scores** for specific geographic clusters over time.

---

## Objective

Use SARIMA to forecast **future safety scores or incident likelihood** within clustered zones, based on:

- **Time of day**
- **Day of week**
- **Season of year**

---

## Step-by-Step Integration Plan

### 1. **Define the Forecast Target**

For each HDBSCAN cluster, define a numeric safety target such as:

- Number of incidents per hour/day
- Severity-weighted safety score

This will be your **time series target** per cluster.

```python
# Example: Calculate daily incident counts per cluster
safety_ts = df.groupby(['cluster_id', 'date']).agg({'incident_id': 'count'}).reset_index()
```

---

### 2. **Decompose by Cluster**

Loop through each `cluster_id` and extract its **time series**:

```python
for cluster in df['cluster_id'].unique():
    cluster_df = safety_ts[safety_ts['cluster_id'] == cluster]
    ts = cluster_df.set_index('date')['incident_id']
```

Ensure the time series is:

- At a consistent frequency (e.g. daily)
- Filled with `0` where no incidents occurred

---

### 3. **Model with SARIMA**

SARIMA handles **trend**, **seasonality**, and **residuals** well. Use `pmdarima` for auto parameter selection:

```bash
pip install pmdarima
```

```python
from pmdarima import auto_arima

model = auto_arima(ts, seasonal=True, m=7, trace=True, suppress_warnings=True)
forecast = model.predict(n_periods=14)  # forecast 2 weeks ahead
```

The `m=7` implies **weekly seasonality**. You can extend this with multi-seasonality if needed (daily + yearly).

---

### 4. **Store and Serve Forecasts**

For each cluster, store:

- Date of forecast
- Predicted safety score
- Confidence intervals (optional)

Update your backend to expose a new API route:

```json
{
  "cluster_id": 3,
  "forecast": [
    {"date": "2025-07-26", "score": 12},
    {"date": "2025-07-27", "score": 15},
    ...
  ]
}
```

---

### 5. **Frontend Integration Plan (Vercel)**

- Allow users to toggle between **current risk view** and **forecasted risk view**
- Show line graphs or heatmaps over time
- Add forecast score overlays on cluster areas
- Use color gradients to reflect future risk

---

## Optional Enhancements

### A. **Use Exogenous Features**

Include additional predictors (SARIMAX):

- **Weather data** — [OpenWeatherMap API](https://openweathermap.org/api)
- **Event schedules** — [NYC Open Data: Event Listings](https://data.cityofnewyork.us/City-Government/NYC-Events-Calendar/6vfn-xw2j)
- **School/Holiday calendars** — [NYC DOE Calendar API or CSV](https://www.schools.nyc.gov/about-us/news/2024-2025-school-year-calendar)
- **Transit delays** — [MTA Real-Time Data Feeds](https://datamine.mta.info/)

These should be time-aligned and normalized to match each cluster’s time series.

### B. **Rolling Forecasting Window**

Train SARIMA on a rolling window (e.g., last 60 days) for adaptive predictions.

### C. **Detect Seasonal Outliers**

Use forecast residuals to identify unexpected spikes/drops, triggering alerts.

---

## Deliverables

- Python SARIMA pipeline per cluster
- Daily forecast update task
- JSON API with per-cluster predictions
- Vercel frontend upgrade for risk forecasting UI

---

## Next Step

Once reviewed, we can scaffold the forecast training module and define the API structure for Cursor to integrate.

---

*Created for: Robert Boyle*\
*Last Updated: July 25, 2025*

