# Newark Civic Circuit

Newark-first civic engagement MVP for community input, prioritization, and non-binding signals. This is not official government voting.

## Stack
- Next.js (TypeScript) + Tailwind
- Supabase (Auth, Postgres, Storage) with RLS
- Basic PWA (manifest + service worker)

## Local Setup
1. Install dependencies
   - `npm install`
2. Create a Supabase project
   - Enable Email auth (Magic Link) in Supabase Auth.
   - Set Site URL to `http://localhost:3000`.
3. Run migrations
   - Use Supabase SQL editor or CLI and run the SQL files in `supabase/migrations` in order.
   - Create the storage bucket:
     - Run: `insert into storage.buckets (id, name, public) values ('issue-images', 'issue-images', true);`
4. Configure environment variables
   - Create `.env.local` with:
     - `NEXT_PUBLIC_SUPABASE_URL=...`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
     - `SUPABASE_SERVICE_ROLE_KEY=...`
     - `ADMIN_USER_IDS=comma,separated,uuid,list`
5. Start the dev server
   - `npm run dev`

## MVP Behavior
- Auth: email magic link. Verification tier lives in `public.users`.
- Unverified: read + comment only.
- Light verified: can post issues, support, and impact tag. (Phone input captured but not stored.)
- Strong verified: placeholder.

## Admin Status Updates
- Admin status changes use `POST /api/admin/status` with a bearer token (user JWT) and are checked against `ADMIN_USER_IDS`.
- The API route uses the service role key to update `issues.status` and insert `status_events`.
- Example payload:
  ```json
  {
    "issue_id": "<uuid>",
    "to_status": "Under review",
    "note": "Assigned to Public Works"
  }
  ```

## Routes
- `/` feed
- `/issue/new` create issue
- `/issue/[id]` issue detail
- `/brief` monthly brief
- `/api/brief` JSON export for brief

## Notes
- The PWA is installable via `public/manifest.json` and `public/sw.js`.
- Replace `public/icon.svg` with PNG icons if you want full install badge support.
