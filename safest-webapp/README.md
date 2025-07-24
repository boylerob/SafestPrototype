# Safest WebApp - Safety Intelligence Platform

A professional web application showcasing real-time safety data visualization and mapping for New York City. Built for investor presentations and demonstrations.

## Features

- **Real-time Safety Data**: Live incident data from NYPD and 911 calls
- **Interactive Map**: Mapbox-powered map with safety incident markers
- **Professional UI**: Clean, investor-ready interface with safety metrics
- **Data Analytics**: Visual representation of safety statistics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Mapping**: Mapbox GL JS
- **Data**: NYC Open Data APIs (Socrata)
- **Deployment**: Vercel (recommended)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Mapbox access token**:
   - Get a free Mapbox access token from [mapbox.com](https://mapbox.com)
   - Update `src/config/config.ts` with your token

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

Update the configuration in `src/config/config.ts`:

```typescript
export const config = {
  mapbox: {
    accessToken: 'your_mapbox_access_token_here'
  },
  socrata: {
    appToken: 'your_socrata_app_token_here'
  }
};
```

## API Keys Required

1. **Mapbox Access Token**: For map rendering and tiles
2. **Socrata App Token**: For NYC Open Data API access

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── page.tsx        # Main page component
│   └── layout.tsx      # Root layout
├── components/         # React components
│   └── SafetyMap.tsx   # Main map component
├── config/            # Configuration files
│   └── config.ts      # API keys and settings
└── services/          # Data services
    └── nycDataService.ts # NYC data fetching logic
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables for API keys
4. Deploy automatically

### Environment Variables

Set these in your deployment platform:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
SOCRATA_APP_TOKEN=your_socrata_token
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Data Sources**: Add to `nycDataService.ts`
2. **UI Components**: Create in `src/components/`
3. **Pages**: Add to `src/app/` directory
4. **Styling**: Use Tailwind CSS classes

## Data Sources

- **NYPD Calls for Service**: Real-time 911 call data
- **NYPD Complaints**: Historical crime complaint data
- **NYC GeoSearch**: Location search and geocoding

## Performance

- Map loads in <3 seconds
- Real-time data updates every 5 minutes
- Optimized for mobile and desktop
- Cached data for better performance

## Security

- API keys stored in environment variables
- CORS configured for NYC APIs
- No sensitive data stored locally

## Support

For questions or issues:
1. Check the console for error messages
2. Verify API keys are correctly configured
3. Ensure network connectivity to NYC APIs

## License

This project is proprietary and confidential.
