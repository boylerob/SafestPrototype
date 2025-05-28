# Safest Prototype Project

Safest is an AI-powered safety navigation app designed for women to navigate public spaces more confidently. This prototype is built for the NYC market using real-time public data and predictive routing intelligence.

---

## Features

- Real-time smart safety maps
- Home Safe check-in journey tracking
- Discreet SOS emergency triggers
- Trusted contact notifications
- Community-based reporting system

---

## Platform Overview

- Built using **React Native + Expo**
- Backend powered by **Firebase**
- Data ingested via **Node.js** using Google Cloud Functions
- Safety logic & routing powered by **Gemini AI**

---

## API Setup Instructions

### 1. Socrata API (NYC Open Data)
**Source**: https://data.cityofnewyork.us  
- Register for a free API token: https://data.cityofnewyork.us/signup
- Example:
```bash
curl "https://data.cityofnewyork.us/resource/9s4h-37hy.json?$limit=1000&$where=precinct='75'" \
  -H "X-App-Token: YOUR_APP_TOKEN"
```

### 2. NYC GeoSearch API
**URL**: https://geosearch.planninglabs.nyc  
No token required.

```bash
curl "https://geosearch.planninglabs.nyc/v1/search?text=Harlem"
```

### 3. NYC 311 Service Requests
```bash
curl "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=1000&agency=NYPD"
```

### 4. Gemini (Google AI)
- Setup Gemini with ADK: https://ai.google.dev/gemini-api/docs
- Install SDK:  
```bash
npm install @google/generative-ai
```
- Store API key:
```env
GEMINI_API_KEY=your_api_key_here
```

---

## Folder Structure
```
SafestApp/
├── ios/                         
├── backend/                     
├── data_pipeline/               
├── ai/                          
├── assets/                      
├── tests/                       
├── docs/                        
└── README.md
```

---

## Getting Started

1. Clone the repo
2. Run `npm install` in root and backend directories
3. Use `expo start` to launch the mobile preview
4. Follow API setup instructions above
