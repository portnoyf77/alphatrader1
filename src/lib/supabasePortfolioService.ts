/**
 * Supabase Portfolio Service
 *
 * Replaces localStorage-based portfolio storage and mockData queries
 * with real Supabase database operations.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Portfolio,
  Holding,
  PerformanceMetrics,
  ActivityLogEntry,
  ExposureBreakdown,
  PortfolioStatus,
  ValidationStatus,
  RiskLevel,
  Objective,
  StrategyType,
  TurnoverLevel,
  GeoFocus,
} from './types';

// ── Types for Supabase rows ────────────────────────────────

export interface SupabaseProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  plan: string | null;
  trial_started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabasePortfolioRow {
  id: string;
  creator_id: string;
  name: string;
  strategy_type: StrategyType;
  objective: Objective;
  risk_level: RiskLevel;
  geo_focus: GeoFocus;
  status: PortfolioStatus;
  validation_status: ValidationStatus;
  validation_criteria_met: boolean;
  validation_summary: string | null;
  allowed_assets: string[];
  leverage_allowed: boolean;
  max_single_sector_exposure_pct: number;
  max_turnover: TurnoverLevel;
  exposure_breakdown: ExposureBreakdown[];
  top_themes: string[];
  turnover_estimate: TurnoverLevel;
  sectors: string[];
  disclosure_text_public: string;
  description_rationale: string | null;
  risks: string | null;
  followers_count: number;
  allocated_amount_usd: number;
  new_allocations_paused: boolean;
  creator_fee_pct: number;
  creator_est_monthly_earnings_usd: number;
  creator_investment: number;
  requires_opt_in_for_structural_changes: boolean;
  exit_window_days: number;
  auto_exit_on_liquidation: boolean;
  pending_update: string | null;
  pending_change_summary: string | null;
  created_at: string;
  updated_at: string;
  last_rebalanced_at: string | null;
}

export interface FollowedPortfolioRow {
  id: string;
  user_id: string;
  portfolio_id: string;
  allocation_usd: number;
  allocated_at: string;
}

// ── Helpers to convert DB rows to app types ────────────────

function toAppPortfolio(
  row: SupabasePortfolioRow,
  holdings: Holding[],
  performance: PerformanceMetrics | null,
  activityLog: ActivityLogEntry[],
  creatorUsername?: string | null,
): Portfolio {
  return {
    id: row.id,
    name: row.name,
    creator_id: creatorUsername || row.creator_id,
    status: row.status,
    validation_status: row.validation_status,
    validation_criteria_met: row.validation_criteria_met,
    validation_summary: row.validation_summary || undefined,
    created_date: row.created_at.split('T')[0],
    last_rebalanced_date: row.last_rebalanced_at
      ? row.last_rebalanced_at.split('T')[0]
      : row.created_at.split('T')[0],
    strategy_type: row.strategy_type,
    objective: row.objective,
    risk_level: row.risk_level,
    allowed_assets: row.allowed_assets,
    leverage_allowed: row.leverage_allowed,
    max_single_sector_exposure_pct: row.max_single_sector_exposure_pct,
    max_turnover: row.max_turnover,
    holdings,
    exposure_breakdown: row.exposure_breakdown || [],
    top_themes: row.top_themes || [],
    turnover_estimate: row.turnover_estimate,
    disclosure_text_public: row.disclosure_text_public,
    performance: performance || {
      return_30d: 0,
      return_90d: 0,
      max_drawdown: 0,
      volatility: 0,
      consistency_score: 50,
    },
    activity_log: activityLog,
    followers_count: row.followers_count,
    allocated_amount_usd: row.allocated_amount_usd,
    new_allocations_paused: row.new_allocations_paused,
    creator_fee_pct: row.creator_fee_pct,
    creator_est_monthly_earnings_usd: row.creator_est_monthly_earnings_usd,
    creator_investment: Number(row.creator_investment),
    requires_opt_in_for_structural_changes: row.requires_opt_in_for_structural_changes,
    exit_window_days: row.exit_window_days,
    auto_exit_on_liquidation: row.auto_exit_on_liquidation,
    pending_update: row.pending_update || undefined,
    pending_change_summary: row.pending_change_summary || undefined,
    sectors: row.sectors || [],
    geo_focus: row.geo_focus,
    description_rationale: row.description_rationale || '',
    risks: row.risks || '',
  };
}

// ── PROFILE OPERATIONS ─────────────────────────────────────

export async function getProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<SupabaseProfile, 'username' | 'display_name' | 'avatar_url' | 'plan'>>
) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
}

// ── PORTFOLIO READ OPERATIONS ──────────────────────────────

/**
 * Fetch a single portfolio with all related data (holdings, performance, activity).
 */
export async function getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
  const [portfolioRes, holdingsRes, perfRes, activityRes] = await Promise.all([
    supabase.from('portfolios').select('*').eq('id', portfolioId).single(),
    supabase.from('portfolio_holdings').select('*').eq('portfolio_id', portfolioId),
    supabase
      .from('portfolio_performance')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('recorded_at', { ascending: false })
      .limit(1),
    supabase
      .from('portfolio_activity_log')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('occurred_at', { ascending: false }),
  ]);

  if (portfolioRes.error || !portfolioRes.data) return null;

  const holdings: Holding[] = (holdingsRes.data || []).map((h: any) => ({
    ticker: h.ticker,
    name: h.name,
    weight: Number(h.weight),
    sector: h.sector,
  }));

  const perf = perfRes.data?.[0];
  const performance: PerformanceMetrics | null = perf
    ? {
        return_30d: Number(perf.return_30d),
        return_90d: Number(perf.return_90d),
        max_drawdown: Number(perf.max_drawdown),
        volatility: Number(perf.volatility),
        consistency_score: perf.consistency_score,
      }
    : null;

  const activityLog: ActivityLogEntry[] = (activityRes.data || []).map((a: any) => ({
    date: a.occurred_at.split('T')[0],
    event_type: a.event_type,
    summary: a.summary,
  }));

  // Fetch creator username
  const { data: creator } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', portfolioRes.data.creator_id)
    .single();

  return toAppPortfolio(
    portfolioRes.data as unknown as SupabasePortfolioRow,
    holdings,
    performance,
    activityLog,
    creator?.username,
  );
}

/**
 * Fetch all portfolios created by the current user.
 */
export async function getMyPortfolios(): Promise<Portfolio[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !portfolios) return [];

  // Batch-fetch holdings and performance for all portfolios
  const ids = portfolios.map((p: any) => p.id);

  const [holdingsRes, perfRes] = await Promise.all([
    supabase.from('portfolio_holdings').select('*').in('portfolio_id', ids),
    supabase
      .from('portfolio_performance')
      .select('*')
      .in('portfolio_id', ids)
      .order('recorded_at', { ascending: false }),
  ]);

  const holdingsByPortfolio = new Map<string, Holding[]>();
  for (const h of holdingsRes.data || []) {
    const arr = holdingsByPortfolio.get(h.portfolio_id) || [];
    arr.push({ ticker: h.ticker, name: h.name, weight: Number(h.weight), sector: h.sector });
    holdingsByPortfolio.set(h.portfolio_id, arr);
  }

  // Only keep the latest performance per portfolio
  const perfByPortfolio = new Map<string, PerformanceMetrics>();
  for (const p of perfRes.data || []) {
    if (!perfByPortfolio.has(p.portfolio_id)) {
      perfByPortfolio.set(p.portfolio_id, {
        return_30d: Number(p.return_30d),
        return_90d: Number(p.return_90d),
        max_drawdown: Number(p.max_drawdown),
        volatility: Number(p.volatility),
        consistency_score: p.consistency_score,
      });
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  return portfolios.map((row: any) =>
    toAppPortfolio(
      row as SupabasePortfolioRow,
      holdingsByPortfolio.get(row.id) || [],
      perfByPortfolio.get(row.id) || null,
      [], // Activity logs fetched separately when needed
      profile?.username,
    )
  );
}

/**
 * Fetch all validated & listed portfolios for the Explore/marketplace page.
 * This replaces getValidatedStrategies() from mockData.
 */
export async function getValidatedPortfolios(): Promise<Portfolio[]> {
  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('status', 'validated_listed')
    .eq('validation_status', 'validated')
    .eq('validation_criteria_met', true)
    .order('followers_count', { ascending: false });

  if (error || !portfolios) return [];

  const ids = portfolios.map((p: any) => p.id);
  if (ids.length === 0) return [];

  const [holdingsRes, perfRes, creatorsRes] = await Promise.all([
    supabase.from('portfolio_holdings').select('*').in('portfolio_id', ids),
    supabase
      .from('portfolio_performance')
      .select('*')
      .in('portfolio_id', ids)
      .order('recorded_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, username')
      .in('id', [...new Set(portfolios.map((p: any) => p.creator_id))]),
  ]);

  const holdingsByPortfolio = new Map<string, Holding[]>();
  for (const h of holdingsRes.data || []) {
    const arr = holdingsByPortfolio.get(h.portfolio_id) || [];
    arr.push({ ticker: h.ticker, name: h.name, weight: Number(h.weight), sector: h.sector });
    holdingsByPortfolio.set(h.portfolio_id, arr);
  }

  const perfByPortfolio = new Map<string, PerformanceMetrics>();
  for (const p of perfRes.data || []) {
    if (!perfByPortfolio.has(p.portfolio_id)) {
      perfByPortfolio.set(p.portfolio_id, {
        return_30d: Number(p.return_30d),
        return_90d: Number(p.return_90d),
        max_drawdown: Number(p.max_drawdown),
        volatility: Number(p.volatility),
        consistency_score: p.consistency_score,
      });
    }
  }

  const creatorMap = new Map<string, string>();
  for (const c of creatorsRes.data || []) {
    creatorMap.set(c.id, c.username || c.id);
  }

  return portfolios.map((row: any) =>
    toAppPortfolio(
      row as SupabasePortfolioRow,
      holdingsByPortfolio.get(row.id) || [],
      perfByPortfolio.get(row.id) || null,
      [],
      creatorMap.get(row.creator_id),
    )
  );
}

/**
 * Fetch portfolios with pending updates (for follower notifications).
 * Replaces getPortfoliosWithPendingUpdates() from mockData.
 */
export async function getPortfoliosWithPendingUpdates(): Promise<Portfolio[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get portfolio IDs the user follows
  const { data: follows } = await supabase
    .from('followed_portfolios')
    .select('portfolio_id')
    .eq('user_id', user.id);

  if (!follows || follows.length === 0) return [];

  const followedIds = follows.map((f: any) => f.portfolio_id);

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*')
    .in('id', followedIds)
    .not('pending_update', 'is', null);

  if (!portfolios || portfolios.length === 0) return [];

  return portfolios.map((row: any) =>
    toAppPortfolio(row as SupabasePortfolioRow, [], null, [])
  );
}

// ── PORTFOLIO WRITE OPERATIONS ─────────────────────────────

export interface CreatePortfolioInput {
  name: string;
  strategyType?: StrategyType;
  objective: string;
  riskLevel: RiskLevel;
  geoFocus?: GeoFocus;
  status?: PortfolioStatus;
  holdings: { ticker: string; name: string; weight: number; sector?: string }[];
  descriptionRationale?: string;
  risks?: string;
  exposureBreakdown?: ExposureBreakdown[];
  topThemes?: string[];
  sectors?: string[];
  creatorInvestment?: number;
}

/**
 * Create a new portfolio with holdings.
 * Replaces the localStorage persistPortfolio() flow.
 */
export async function createPortfolio(input: CreatePortfolioInput): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Insert portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .insert({
      creator_id: user.id,
      name: input.name,
      strategy_type: input.strategyType || 'GenAI',
      objective: input.objective as Objective,
      risk_level: input.riskLevel,
      geo_focus: input.geoFocus || 'US',
      status: input.status || 'private',
      validation_status: 'simulated' as ValidationStatus,
      exposure_breakdown: input.exposureBreakdown || [],
      top_themes: input.topThemes || [],
      sectors: input.sectors || [],
      description_rationale: input.descriptionRationale,
      risks: input.risks,
      creator_investment: input.creatorInvestment || 0,
    })
    .select('id')
    .single();

  if (portfolioError || !portfolio) {
    throw new Error(`Failed to create portfolio: ${portfolioError?.message}`);
  }

  // Insert holdings
  if (input.holdings.length > 0) {
    const holdingRows = input.holdings.map((h) => ({
      portfolio_id: portfolio.id,
      ticker: h.ticker,
      name: h.name,
      weight: h.weight,
      sector: h.sector || null,
    }));

    const { error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .insert(holdingRows);

    if (holdingsError) {
      console.error('Failed to insert holdings:', holdingsError);
    }
  }

  // Insert initial performance snapshot
  const { error: perfError } = await supabase
    .from('portfolio_performance')
    .insert({
      portfolio_id: portfolio.id,
      return_30d: 0,
      return_90d: 0,
      max_drawdown: 0,
      volatility: 0,
      consistency_score: 50,
    });

  if (perfError) {
    console.error('Failed to insert initial performance:', perfError);
  }

  return portfolio.id;
}

/**
 * Update portfolio status (e.g., from 'private' to 'validated_listed').
 */
export async function updatePortfolioStatus(
  portfolioId: string,
  status: PortfolioStatus,
) {
  const { error } = await supabase
    .from('portfolios')
    .update({ status })
    .eq('id', portfolioId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

/**
 * Update portfolio holdings (replace all).
 */
export async function updatePortfolioHoldings(
  portfolioId: string,
  holdings: { ticker: string; name: string; weight: number; sector?: string }[],
) {
  // Delete existing
  await supabase
    .from('portfolio_holdings')
    .delete()
    .eq('portfolio_id', portfolioId);

  // Insert new
  if (holdings.length > 0) {
    const { error } = await supabase
      .from('portfolio_holdings')
      .insert(
        holdings.map((h) => ({
          portfolio_id: portfolioId,
          ticker: h.ticker,
          name: h.name,
          weight: h.weight,
          sector: h.sector || null,
        }))
      );

    if (error) throw new Error(`Failed to update holdings: ${error.message}`);
  }
}

// ── FOLLOW OPERATIONS ──────────────────────────────────────

export async function followPortfolio(portfolioId: string, allocationUsd: number = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('followed_portfolios')
    .insert({
      user_id: user.id,
      portfolio_id: portfolioId,
      allocation_usd: allocationUsd,
    });

  if (error) throw new Error(`Failed to follow portfolio: ${error.message}`);

  // Increment follower count
  await supabase.rpc('increment_followers', { p_portfolio_id: portfolioId });
}

export async function unfollowPortfolio(portfolioId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('followed_portfolios')
    .delete()
    .eq('user_id', user.id)
    .eq('portfolio_id', portfolioId);

  if (error) throw new Error(`Failed to unfollow portfolio: ${error.message}`);
}

export async function getFollowedPortfolios(): Promise<
  (Portfolio & { myAllocation: number })[]
> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: follows } = await supabase
    .from('followed_portfolios')
    .select('portfolio_id, allocation_usd')
    .eq('user_id', user.id);

  if (!follows || follows.length === 0) return [];

  const allocMap = new Map<string, number>();
  for (const f of follows) {
    allocMap.set(f.portfolio_id, Number(f.allocation_usd));
  }

  const ids = follows.map((f: any) => f.portfolio_id);
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*')
    .in('id', ids);

  if (!portfolios) return [];

  return portfolios.map((row: any) => ({
    ...toAppPortfolio(row as SupabasePortfolioRow, [], null, []),
    myAllocation: allocMap.get(row.id) || 0,
  }));
}

// ── COMMENT OPERATIONS ─────────────────────────────────────

export interface AppComment {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
}

export async function getPortfolioComments(portfolioId: string): Promise<AppComment[]> {
  const { data, error } = await supabase
    .from('portfolio_comments')
    .select('*, profiles!author_id(username)')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((c: any) => ({
    id: c.id,
    author: c.profiles?.username || 'Anonymous',
    content: c.content,
    date: formatRelativeDate(c.created_at),
    likes: c.likes,
  }));
}

export async function postComment(portfolioId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('portfolio_comments').insert({
    portfolio_id: portfolioId,
    author_id: user.id,
    content,
  });

  if (error) throw new Error(`Failed to post comment: ${error.message}`);
}

// ── UTILITY ────────────────────────────────────────────────

function formatRelativeDate(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(isoDate).toLocaleDateString();
}

/**
 * Aggregate stats (replaces creatorStats from mockData).
 * Computes from real data instead of hardcoded mock values.
 */
export async function getCreatorStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('creator_est_monthly_earnings_usd, creator_investment, status')
    .eq('creator_id', user.id);

  if (!portfolios || portfolios.length === 0) {
    return {
      totalCreatorEarnings30d: 0,
      totalAlphaEarnings: 0,
      topCreatorEarnings: 0,
      avgEarningsPerStrategy: 0,
      totalCreators: 1,
      totalCreatorInvestment: 0,
    };
  }

  const earnings = portfolios.map((p: any) => Number(p.creator_est_monthly_earnings_usd));
  const listed = portfolios.filter((p: any) => p.status === 'validated_listed');
  const total30d = earnings.reduce((a: number, b: number) => a + b, 0);

  return {
    totalCreatorEarnings30d: total30d,
    totalAlphaEarnings: total30d * 6,
    topCreatorEarnings: Math.max(...earnings),
    avgEarningsPerStrategy:
      listed.length > 0
        ? Math.round(
            listed.reduce((a: number, p: any) => a + Number(p.creator_est_monthly_earnings_usd), 0) /
              listed.length
          )
        : 0,
    totalCreators: 1, // Will be computed differently when multi-user
    totalCreatorInvestment: portfolios.reduce(
      (a: number, p: any) => a + Number(p.creator_investment),
      0
    ),
  };
}
