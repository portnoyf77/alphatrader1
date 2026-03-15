

## Plan: Add City-Level Visitor Analytics (Based on felixportnoy.com Pattern)

This replicates the analytics tracking system from your [Felix Portnoy - Portfolio](/projects/ba54dabc-ef46-463d-8779-1e8c4c4bbcee) project, adapted for Alpha Trader.

### What Gets Built

1. **Database table** (`page_views`) to store every visit with city, region, country, IP (anonymized), session tracking, and time-on-page.

2. **Backend function** (`track-page-view`) that:
   - Receives page path, user agent, referrer, session ID from the client
   - Extracts visitor IP from request headers
   - Calls `ip-api.com` (free, no API key) to resolve city/region/country
   - Anonymizes IP (masks last octet) before storing
   - Handles exit events to record time-on-page

3. **Client hook** (`usePageView`) added to the app that fires on every route change, tracking entry and exit times.

4. **Admin analytics page** (`/admin/analytics`) showing a dashboard with:
   - Visitor count, pageviews, avg session duration
   - City/region/country breakdown table
   - Top pages table
   - Device breakdown

### Technical Details

**Database Migration** (single migration combining all columns):
```sql
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  timezone TEXT,
  time_on_page INTEGER DEFAULT 0,
  exited_at TIMESTAMPTZ,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS policies:
- Service role only for INSERT and UPDATE (edge function uses service role key)
- SELECT denied to public (admin page queries via edge function)
- DELETE denied to public

**Edge Function** (`track-page-view/index.ts`): Direct port from felixportnoy project with IP anonymization and ip-api.com geolocation lookup.

**Client Hook** (`src/hooks/usePageView.ts`): Tracks page entry via edge function invocation, tracks exit via `fetch` with `keepalive` on `beforeunload`/`visibilitychange`. No consent gate needed since Alpha Trader doesn't have a cookie consent system.

**Analytics Dashboard** (`src/pages/AdminAnalytics.tsx`): A simple protected page querying `page_views` via an edge function (to avoid exposing the table to the client). Shows geographic and engagement breakdowns.

### Files Created/Modified
- `supabase/functions/track-page-view/index.ts` -- new edge function
- `supabase/functions/analytics-dashboard/index.ts` -- new edge function for reading analytics
- `src/hooks/usePageView.ts` -- new hook
- `src/pages/AdminAnalytics.tsx` -- new analytics dashboard page
- `src/App.tsx` -- add route for `/admin/analytics`, add `usePageView` hook
- Database migration for `page_views` table + RLS policies

