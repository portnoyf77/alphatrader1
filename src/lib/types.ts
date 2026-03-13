// Portfolio status types
export type PortfolioStatus = 'private' | 'validated_listed' | 'inactive';
export type VisibilityMode = 'masked' | 'transparent';
export type TurnoverLevel = 'low' | 'medium' | 'high';
export type ActivityEventType = 'rebalance' | 'risk_alert' | 'paused_new_allocations' | 'unpaused' | 'inactive';

// Legacy types (keeping for backward compatibility in creator build experience)
export type LegacyPortfolioStatus = 'Simulated' | 'Live' | 'Live (coming soon)';
export type StrategyType = 'GenAI' | 'Manual';
export type Objective = 'Growth' | 'Income' | 'Low volatility' | 'Balanced';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ValidationStatus = 'simulated' | 'in_validation' | 'validated';
export type GeoFocus = 'US' | 'Global' | 'Emerging Markets' | 'International';

export interface Holding {
  ticker: string;
  name: string;
  weight: number;
  sector?: string;
}

export interface PerformanceMetrics {
  return_30d: number;
  return_90d: number;
  max_drawdown: number;
  volatility: number;
  consistency_score: number;
}

export interface ActivityLogEntry {
  date: string;
  event_type: ActivityEventType;
  summary: string;
}

export interface ExposureBreakdown {
  label: string;
  percent: number;
}

// Main Portfolio interface (for public views)
export interface Portfolio {
  id: string;
  name: string;
  creator_id: string;
  creator_avatar?: string;
  
  // Status and visibility
  status: PortfolioStatus;
  visibility_mode: VisibilityMode;
  validation_status: ValidationStatus;
  validation_criteria_met: boolean;
  validation_summary?: string;
  
  // Creation and dates
  created_date: string;
  last_rebalanced_date: string;
  
  // Portfolio characteristics
  strategy_type: StrategyType;
  objective: Objective;
  risk_level: RiskLevel;
  
  // Risk profile and constraints
  allowed_assets: string[];
  leverage_allowed: boolean;
  max_single_sector_exposure_pct: number;
  max_turnover: TurnoverLevel;
  
  // Holdings (only shown if visibility_mode = 'transparent')
  holdings: Holding[];
  
  // Masked exposure (shown when visibility_mode = 'masked')
  exposure_breakdown: ExposureBreakdown[];
  top_themes: string[];
  turnover_estimate: TurnoverLevel;
  disclosure_text_public: string;
  
  // Performance
  performance: PerformanceMetrics;
  
  // Activity log (public-safe)
  activity_log: ActivityLogEntry[];
  
  // Follower state
  followers_count: number;
  allocated_amount_usd: number;
  new_allocations_paused: boolean;
  creator_fee_pct: number;
  creator_est_monthly_earnings_usd: number;
  creator_investment: number;
  
  // Follower protections
  requires_opt_in_for_structural_changes: boolean;
  exit_window_days: number;
  auto_exit_on_liquidation: boolean;
  
  // Pending updates (for structural changes requiring opt-in)
  pending_update?: string;
  pending_change_summary?: string;
  
  // Portfolio identity fields
  sectors: string[];
  geo_focus: GeoFocus;
  
  // Rationale and risks
  description_rationale: string;
  risks: string;
}

// Type alias for backward compatibility - Strategy uses same interface
export type Strategy = Portfolio;

export interface ChartDataPoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  date: string;
  likes: number;
}
