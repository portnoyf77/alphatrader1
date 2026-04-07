-- ============================================================
-- Alpha Trader - Core Schema Migration
-- Creates: profiles, portfolios, portfolio_holdings,
--          portfolio_performance, followed_portfolios, comments
-- ============================================================

-- ── 1. ENUM TYPES ──────────────────────────────────────────

CREATE TYPE portfolio_status AS ENUM ('private', 'validated_listed', 'inactive');
CREATE TYPE validation_status AS ENUM ('simulated', 'in_validation', 'validated');
CREATE TYPE risk_level AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE objective_type AS ENUM ('Growth', 'Income', 'Low volatility', 'Balanced');
CREATE TYPE strategy_type AS ENUM ('GenAI', 'Manual');
CREATE TYPE turnover_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE geo_focus AS ENUM ('US', 'Global', 'Emerging Markets', 'International');
CREATE TYPE activity_event_type AS ENUM ('rebalance', 'risk_alert', 'paused_new_allocations', 'unpaused', 'inactive');

-- ── 2. PROFILES ────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'basic',
  trial_started_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. PORTFOLIOS ──────────────────────────────────────────

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  strategy_type strategy_type NOT NULL DEFAULT 'GenAI',
  objective objective_type NOT NULL DEFAULT 'Growth',
  risk_level risk_level NOT NULL DEFAULT 'Medium',
  geo_focus geo_focus NOT NULL DEFAULT 'US',

  -- Status
  status portfolio_status NOT NULL DEFAULT 'private',
  validation_status validation_status NOT NULL DEFAULT 'simulated',
  validation_criteria_met BOOLEAN DEFAULT false,
  validation_summary TEXT,

  -- Constraints
  allowed_assets TEXT[] DEFAULT '{}',
  leverage_allowed BOOLEAN DEFAULT false,
  max_single_sector_exposure_pct INTEGER DEFAULT 40,
  max_turnover turnover_level DEFAULT 'medium',

  -- Exposure & themes
  exposure_breakdown JSONB DEFAULT '[]',
  top_themes TEXT[] DEFAULT '{}',
  turnover_estimate turnover_level DEFAULT 'medium',
  sectors TEXT[] DEFAULT '{}',

  -- Disclosure
  disclosure_text_public TEXT DEFAULT 'This portfolio uses transparent holdings.',

  -- Rationale & risks
  description_rationale TEXT,
  risks TEXT,

  -- Follower economics
  followers_count INTEGER DEFAULT 0,
  allocated_amount_usd NUMERIC(14,2) DEFAULT 0,
  new_allocations_paused BOOLEAN DEFAULT false,
  creator_fee_pct NUMERIC(5,4) DEFAULT 0.0025,
  creator_est_monthly_earnings_usd NUMERIC(10,2) DEFAULT 0,
  creator_investment NUMERIC(14,2) DEFAULT 0,

  -- Follower protections
  requires_opt_in_for_structural_changes BOOLEAN DEFAULT true,
  exit_window_days INTEGER DEFAULT 7,
  auto_exit_on_liquidation BOOLEAN DEFAULT true,

  -- Pending updates
  pending_update TEXT,
  pending_change_summary TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_rebalanced_at TIMESTAMPTZ
);

-- ── 4. PORTFOLIO HOLDINGS ──────────────────────────────────

CREATE TABLE portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (portfolio_id, ticker)
);

-- ── 5. PORTFOLIO PERFORMANCE (time-series) ─────────────────

CREATE TABLE portfolio_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT now(),

  return_30d NUMERIC(8,2),
  return_90d NUMERIC(8,2),
  max_drawdown NUMERIC(8,2),
  volatility NUMERIC(8,2),
  consistency_score INTEGER,

  UNIQUE (portfolio_id, recorded_at)
);

-- ── 6. ACTIVITY LOG ────────────────────────────────────────

CREATE TABLE portfolio_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  event_type activity_event_type NOT NULL,
  summary TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- ── 7. FOLLOWED PORTFOLIOS (investor allocations) ──────────

CREATE TABLE followed_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  allocation_usd NUMERIC(14,2) DEFAULT 0,
  allocated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, portfolio_id)
);

-- ── 8. COMMENTS ────────────────────────────────────────────

CREATE TABLE portfolio_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 9. INDEXES ─────────────────────────────────────────────

CREATE INDEX idx_portfolios_creator ON portfolios(creator_id);
CREATE INDEX idx_portfolios_status ON portfolios(status);
CREATE INDEX idx_portfolios_risk ON portfolios(risk_level);
CREATE INDEX idx_portfolios_validated ON portfolios(validation_status, status)
  WHERE validation_status = 'validated' AND status = 'validated_listed';
CREATE INDEX idx_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_performance_portfolio ON portfolio_performance(portfolio_id);
CREATE INDEX idx_activity_portfolio ON portfolio_activity_log(portfolio_id);
CREATE INDEX idx_followed_user ON followed_portfolios(user_id);
CREATE INDEX idx_followed_portfolio ON followed_portfolios(portfolio_id);
CREATE INDEX idx_comments_portfolio ON portfolio_comments(portfolio_id);

-- ── 10. ROW LEVEL SECURITY ─────────────────────────────────

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read any profile"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see validated_listed portfolios
CREATE POLICY "Anyone can read listed portfolios"
  ON portfolios FOR SELECT TO authenticated
  USING (
    status = 'validated_listed'
    OR creator_id = auth.uid()
  );

CREATE POLICY "Creators can insert portfolios"
  ON portfolios FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own portfolios"
  ON portfolios FOR UPDATE TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete own portfolios"
  ON portfolios FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- Holdings
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holdings visible with portfolio"
  ON portfolio_holdings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_holdings.portfolio_id
      AND (p.status = 'validated_listed' OR p.creator_id = auth.uid())
    )
  );

CREATE POLICY "Creators can manage holdings"
  ON portfolio_holdings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_holdings.portfolio_id
      AND p.creator_id = auth.uid()
    )
  );

-- Performance
ALTER TABLE portfolio_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Performance visible with portfolio"
  ON portfolio_performance FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_performance.portfolio_id
      AND (p.status = 'validated_listed' OR p.creator_id = auth.uid())
    )
  );

CREATE POLICY "System can insert performance"
  ON portfolio_performance FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_performance.portfolio_id
      AND p.creator_id = auth.uid()
    )
  );

-- Activity log
ALTER TABLE portfolio_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity visible with portfolio"
  ON portfolio_activity_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_activity_log.portfolio_id
      AND (p.status = 'validated_listed' OR p.creator_id = auth.uid())
    )
  );

CREATE POLICY "Creators can log activity"
  ON portfolio_activity_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_activity_log.portfolio_id
      AND p.creator_id = auth.uid()
    )
  );

-- Followed portfolios
ALTER TABLE followed_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own follows"
  ON followed_portfolios FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can follow portfolios"
  ON followed_portfolios FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON followed_portfolios FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Comments
ALTER TABLE portfolio_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON portfolio_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can post comments"
  ON portfolio_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON portfolio_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- ── 11. AUTO-CREATE PROFILE ON SIGNUP ──────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    '@user_' || substr(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 12. UPDATED_AT TRIGGER ─────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
