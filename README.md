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

## Git Rollback Instructions

If you need to revert to the working SOS button state (commit hash: c21a339), use one of these commands:

1. To completely reset to the working state (discards all changes):
```bash
git reset --hard c21a339
```

2. To create a new branch from the working state:
```bash
git checkout -b backup-branch c21a339
```

3. To temporarily view the working state without changing anything:
```bash
git checkout c21a339
```

To return to the latest version after checking out the old version:
```bash
git checkout main
```

Note: The commit hash `c21a339` represents the working state with the SOS button and Vapi integration. This is your "safe point" that you can always return to if needed.

---

## Hot-fix for Demo/Testing: Hardcoded Map Origin

- To keep the map centered on a fixed origin (e.g., 251 Macon Street, Brooklyn) for demo/testing, the following line in `src/screens/main/MapScreen.tsx` is commented out:

```js
// setRegion({
//   latitude: location.coords.latitude,
//   longitude: location.coords.longitude,
//   latitudeDelta: 0.0922,
//   longitudeDelta: 0.0421,
// });
```

- This prevents the map from snapping to the user's current location on load.
- When you want to return to dynamic user location, **uncomment** this block.

---

## Other Notes
- The Directions API call is currently hardcoded to use 251 Macon Street, Brooklyn as the origin for consistent NYC testing.
- Remove or update this when returning to dynamic routing.

---

## Setup, Features, and Usage
(Your existing README content...)
