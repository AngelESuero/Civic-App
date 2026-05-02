import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const ROSELLE = {
  city: 'Roselle, NJ',
  lat: 40.6526,
  lng: -74.2604,
};

const json = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'Roselle Companion', location: ROSELLE });
});

// Official weather/safety: National Weather Service active alerts by point.
app.get('/api/weather/alerts', async (_req, res) => {
  try {
    const data = await json(`https://api.weather.gov/alerts/active?point=${ROSELLE.lat},${ROSELLE.lng}`);
    res.json({ source: 'National Weather Service', sourceType: 'official', items: data.features ?? [] });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// Events: Ticketmaster Discovery API.
app.get('/api/events/ticketmaster', async (req, res) => {
  try {
    const key = process.env.TICKETMASTER_API_KEY;
    if (!key) return res.status(400).json({ error: 'Missing TICKETMASTER_API_KEY' });
    const keyword = req.query.keyword || 'music art community';
    const radius = req.query.radius || '20';
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', key);
    url.searchParams.set('latlong', `${ROSELLE.lat},${ROSELLE.lng}`);
    url.searchParams.set('radius', radius);
    url.searchParams.set('unit', 'miles');
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('sort', 'date,asc');
    const data = await json(url);
    res.json({ source: 'Ticketmaster Discovery API', sourceType: 'public API', items: data?._embedded?.events ?? [] });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// Food/stores: Yelp Fusion business search.
app.get('/api/places/yelp', async (req, res) => {
  try {
    const key = process.env.YELP_API_KEY;
    if (!key) return res.status(400).json({ error: 'Missing YELP_API_KEY' });
    const categories = req.query.categories || 'restaurants,cafes,grocery,arts,fitness';
    const url = new URL('https://api.yelp.com/v3/businesses/search');
    url.searchParams.set('location', ROSELLE.city);
    url.searchParams.set('categories', categories);
    url.searchParams.set('radius', String(Number(req.query.radiusMeters || 8000)));
    url.searchParams.set('limit', String(Number(req.query.limit || 20)));
    const data = await json(url, { headers: { Authorization: `Bearer ${key}` } });
    res.json({ source: 'Yelp Fusion API', sourceType: 'public API', items: data.businesses ?? [] });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// Food/stores/points of interest: Google Places API Nearby Search.
app.get('/api/places/google', async (req, res) => {
  try {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) return res.status(400).json({ error: 'Missing GOOGLE_PLACES_API_KEY' });
    const includedTypes = String(req.query.types || 'restaurant,cafe,store,park,library,gym').split(',');
    const body = {
      includedTypes,
      maxResultCount: Number(req.query.limit || 12),
      locationRestriction: {
        circle: {
          center: { latitude: ROSELLE.lat, longitude: ROSELLE.lng },
          radius: Number(req.query.radiusMeters || 7000),
        },
      },
    };
    const data = await json('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.primaryType,places.rating,places.userRatingCount,places.location,places.googleMapsUri,places.websiteUri'
      },
      body: JSON.stringify(body),
    });
    res.json({ source: 'Google Places API', sourceType: 'public API', items: data.places ?? [] });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// Civic/resource links: these often require feeds, partner APIs, or manual curation.
app.get('/api/curated-sources', (_req, res) => {
  res.json({
    sourceType: 'curated',
    items: [
      { name: 'Borough of Roselle', category: 'civic', url: 'https://www.boroughofroselle.com/' },
      { name: 'Roselle Agendas & Minutes', category: 'civic', url: 'https://www.boroughofroselle.com/government/agendas___minutes/index.php' },
      { name: 'Roselle Office of Emergency Management', category: 'safety', url: 'https://www.boroughofroselle.com/community/office_of_emergency_management.php' },
      { name: 'Union County First Alert', category: 'safety', url: 'https://www.ucfirstalert.org/' },
      { name: 'NJ 211', category: 'resources', url: 'https://nj211.org/' },
      { name: 'NJ TRANSIT Developer Tools', category: 'transit', url: 'https://www.njtransit.com/developer-tools' },
      { name: 'NWS API', category: 'weather', url: 'https://api.weather.gov' }
    ]
  });
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`Roselle Companion API running on http://localhost:${port}`));
