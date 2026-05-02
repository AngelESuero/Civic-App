# Roselle Companion: Real-Time / Near-Real-Time Data Source Plan

## Safety + emergency

- National Weather Service API: official alerts and weather by coordinate.
- FEMA IPAWS feed: public CAP alerts for official emergency messages.
- Roselle OEM/Nixle/UC First Alert: best as sign-up links or monitored public pages, unless a partnership/feed is available.
- Citizen/RCC-style app data: do not assume direct API access. Treat screenshots, pasted alerts, or user notes as personal/unverified until matched to official sources.

## Civic

- Borough of Roselle official website: home, agendas, minutes, council pages, event pages.
- Public meeting agendas/minutes: likely needs scheduled page monitoring unless RSS/API exists.
- Union County election pages: voting dates, results, sample ballots.
- NJ Legislature subscription service: state bill tracking.

## Events

- Ticketmaster Discovery API: events near a lat/long radius.
- PredictHQ: commercial/event intelligence API for richer broad events.
- Meetup/Eventbrite/Facebook/Instagram: useful but API access can be limited or require business permissions; avoid brittle scraping unless terms allow it.
- Borough/community calendars: official/local but may need scheduled crawling.

## Stores, restaurants, places

- Google Places API: broad place search, location, ratings, hours depending on fields requested.
- Yelp Fusion API: restaurants/local businesses and categories, but only businesses with reviews are returned.
- Manual favorites: let users save places they like so personalization does not rely only on ratings.

## Resources/support

- NJ 211: statewide service/resource directory and support navigation.
- findhelp: social care/resource network; API likely requires partnership/terms.
- County and state pages: housing, food, utility, legal aid, job support, senior/youth services.

## Transit

- NJ TRANSIT developer portal / GTFS feeds / service alerts.
- Use GTFS Realtime where credentials and terms allow it.

## Recommended backend architecture

1. `source_connectors`: one connector per source/API.
2. `normalizer`: convert source results to one card shape.
3. `trust_labeler`: official / public / personal / community / unverified.
4. `personalizer`: score by user interests, distance, freshness, urgency.
5. `feed_cache`: cache results so the app is fast and respects API limits.
6. `notebook`: saves user notes, screenshots, links, places, and civic concerns.
7. `verification_matcher`: matches personal/unverified notes against official/public updates.

## Universal card schema

```json
{
  "id": "source-local-id",
  "title": "Card title",
  "summary": "Plain language summary",
  "category": "safety | civic | event | food | store | resource | transit | wellness",
  "sourceName": "Source display name",
  "sourceType": "official | public_api | personal_note | community_unverified",
  "url": "https://...",
  "location": { "lat": 40.6526, "lng": -74.2604, "address": "..." },
  "startsAt": "2026-05-02T18:00:00-04:00",
  "endsAt": null,
  "tags": ["Music", "Civic"],
  "confidence": 0.91,
  "updatedAt": "2026-05-02T11:16:00-04:00"
}
```
