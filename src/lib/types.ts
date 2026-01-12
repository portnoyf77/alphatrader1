export type PortfolioStatus = 'Simulated' | 'Live' | 'Live (coming soon)';
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

export interface Portfolio {
  id: string;
  name: string;
  creator_id: string; // Anonymous user ID (e.g., @inv_7x2k)
  creator_avatar?: string;
  status: PortfolioStatus;
  created_date: string;
  strategy_type: StrategyType;
  objective: Objective;
  risk_level: RiskLevel;
  holdings: Holding[];
  performance: PerformanceMetrics;
  investors_count: number;
  allocated_amount: number;
  creator_investment: number; // Creator's own money invested (skin in the game)
  creator_fee_pct: number;
  creator_est_monthly_earnings: number;
  description_rationale: string;
  risks: string;
  last_rebalanced_date: string;
  // Validation fields
  validation_status: ValidationStatus;
  validation_criteria_met: boolean;
  validation_summary?: string;
  // Portfolio identity fields
  sectors: string[]; // Top 3 sectors from holdings
  geo_focus: GeoFocus;
}

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
