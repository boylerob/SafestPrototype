# Safest NYC - Safety Map v2

A Next.js-based frontend for the Safest NYC safety mapping application with toggleable data layers.

## Features

- **All Incidents**: View every individual safety incident
- **Historical Clusters**: View safety clusters from historical data analysis
- **Predictive Clusters**: View predicted safety hotspots (Coming Soon)

## Architecture

This is a frontend-only v2 that leverages the existing backend infrastructure:

- **Backend**: Uses existing `backend-clustering/` APIs
- **Frontend**: New `safest-webapp-v2/` with improved UX
- **Data Layers**: Toggle between different visualization modes

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── Controls/          # UI controls
│   ├── Map/              # Map components
│   └── DataLayers/       # Data layer components
├── config/               # Configuration
├── services/             # API services
├── hooks/               # Custom React hooks
└── types/               # TypeScript types
```

## Deployment

This v2 frontend can be deployed alongside the existing v1:

- **V1**: `safest-webapp/` → `webapp-vercel-deploy` branch
- **V2**: `safest-webapp-v2/` → `v2-frontend` branch

Both can run simultaneously on Vercel with different URLs. 