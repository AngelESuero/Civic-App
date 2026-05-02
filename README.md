# Roselle Companion Prototype

A mobile-first civic + local-life companion for Roselle, NJ.

## What is included

- `index.html` — self-contained clickable prototype with personalization, source labels, feed cards, and civic notebook.
- `server-starter.js` — optional Express API aggregator starter for weather alerts, events, restaurants/stores, places, and curated civic/resource links.
- `.env.example` — API key placeholders.

## Run the prototype

Open `index.html` in a browser.

## Run the optional API server

```bash
npm install
cp .env.example .env
# add your API keys
npm start
```

Then test:

```bash
curl http://localhost:8787/api/health
curl http://localhost:8787/api/weather/alerts
curl http://localhost:8787/api/curated-sources
```

## Design principles

1. Official/public sources first.
2. Third-party safety posts are personal notes unless verified.
3. Never expose API keys in the mobile app or frontend.
4. Keep the app calm, not fear-based.
5. Personalization should explain why something is shown.

## MVP next steps

1. Connect NWS alerts.
2. Add curated Roselle official links.
3. Add Google Places or Yelp for local businesses.
4. Add Ticketmaster/PredictHQ/Meetup-style event search.
5. Add civic page tracker for Roselle agendas/minutes.
6. Add NJ 211/findhelp resource cards.
7. Add user notebook with source labeling.
