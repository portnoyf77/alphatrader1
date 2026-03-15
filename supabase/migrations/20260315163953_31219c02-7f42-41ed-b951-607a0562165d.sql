
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

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- No public access - edge function uses service role key to bypass RLS
CREATE POLICY "Deny all access to page_views"
  ON public.page_views
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
