# Product Requirements Document (PRD)

## Product Name: Safest

### Version: Prototype (NYC Launch)

---

## 1. Objective

Build a functional iOS prototype of **Safest**, an AI-enhanced safety navigation app for women, using real-time public safety data specific to New York City. The app empowers women to move through urban environments confidently by providing safer routing, emergency triggers, and a community-driven reporting system.

---

## 2. Target Users

- Women in New York City (ages 18–45)
- Primarily those who walk or use public transportation
- Concerned with navigating public spaces safely

---

## 3. Key Features (MVP)

### 3.1 Smart Safety Map

- AI-assisted routing based on real-time NYC crime and environmental data
- Color-coded streets to indicate relative safety levels by time of day
- Dynamic rerouting when a safer path becomes available
- **Routing will only be offered in cities with verified risk-based heat mapping.** If no reliable data exists for a location, the app will not provide routing recommendations.

**Data Inputs:**

- NYC Open Data crime reports (NYPD complaint data)
- 311 service data
- Pedestrian density (if available via open data or 3rd-party APIs)

### 3.2 Home Safe Check-In

- User sets a time they expect to arrive at destination
- App checks in with user; if no response, sends live location to trusted contacts
- Optional: Notify emergency services (future integration)

### 3.3 SOS Quick Trigger

- Double-press of lock button triggers emergency mode
- Sends live location to emergency contacts
- Starts audio recording (stored locally and backed up to secure cloud)
- Optional distraction sound (e.g. fake call)

### 3.4 Trusted Contact Network

- User selects 1–3 trusted contacts
- Contacts receive updates: departure, check-in confirmation, SOS alerts
- **If the contact does not have the app, they will receive a text prompt to download it. If they already have the app, they will receive standard push notifications.**

### 3.5 Community Reporting

- Users can report issues in real time:
  - Harassment, catcalling, broken lights, unsafe areas
- Moderated backend for report validation and data quality

---

## 4. Platform & Tech Stack

- **Foundational AI Model**: Gemini (Google)
  - Will serve as the core agentic source for AI-powered features including route intelligence, anomaly detection, and context-aware suggestions
  - Gemini ADK will be leveraged for future agent deployment and multimodal processing
  - Once safety mapping and scoring are operational, Gemini will power real-time route optimization by analyzing dynamic factors (e.g., crime density, time of day, crowd levels) and continuously rerouting users to maintain maximum safety.

- **iOS via Expo (React Native)** to streamline development and testing across iOS (and eventually Android) without full Xcode dependency

- **Backend**: Firebase (Auth, Realtime DB, Functions)

- **Data Ingestion**: Node.js-based ETL scripts hosted on Google Cloud Functions (replacing Python for better alignment with Cursor workflows)

- **Mapping**: Mapbox SDK or Apple MapKit with custom overlays

- **Analytics & Monitoring**: Firebase Analytics, Sentry for error tracking

---

## 5. Non-Functional Requirements

- Data privacy: AES-256 encryption for stored data; GDPR/CCPA compliance
- Failover: Check-in logic must function offline with stored location fallback
- Accessibility: VoiceOver, high contrast mode supported
- Offline Mode: Cached maps + pre-pulled NYC data for safety overlays

---

## 6. Key Milestones

| Milestone                      | Target Date   |
| ------------------------------ | ------------- |
| Data source pipeline live      | June 15, 2025 |
| iOS app prototype UI complete  | June 22, 2025 |
| Core feature logic implemented | July 10, 2025 |
| NYC pilot build complete       | July 20, 2025 |
| Internal testing & bug fixes   | Aug 1, 2025   |
| First beta test (NYC cohort)   | Aug 15, 2025  |

---

## 7. Success Criteria

- App functions with 90%+ reliability during internal test
- Safety scores load correctly for NYC streets with at least hourly updates
- Home Safe logic works with real check-in triggers and fallback mode
- SOS trigger initiates appropriate response within 3 seconds
- Community reporting feature submits to backend and renders in map UI

---

## 8. Appendices

### Appendix A: Wireframes (Initial Prototype Concept)
(See attached mockups in /assets/mockups)

### Appendix B: NYC Public Safety Data Sources & APIs
(See data source references)

### Appendix C: Sample data payloads for ETL
*TBD*

### Appendix D: Safety score algorithm v0.1
*TBD*

### Appendix E: Project Structure / Scaffolding
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
