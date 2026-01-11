export type PortfolioStatus = 'Simulated' | 'Live' | 'Live (coming soon)';
export type StrategyType = 'GenAI' | 'Manual';
export type Objective = 'Growth' | 'Income' | 'Low volatility' | 'Balanced';
export type RiskLevel = 'Low' | 'Medium' | 'High';

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
  creator_name: string;
  creator_avatar?: string;
  status: PortfolioStatus;
  created_date: string;
  strategy_type: StrategyType;
  objective: Objective;
  risk_level: RiskLevel;
  holdings: Holding[];
  performance: PerformanceMetrics;
  followers_count: number;
  allocated_amount: number;
  creator_fee_pct: number;
  creator_est_monthly_earnings: number;
  description_rationale: string;
  risks: string;
  last_rebalanced_date: string;
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