/**
 * Types for the hybrid AI-led portfolio creation flow.
 *
 * Stage 1: portfolio-recommend -- AI proposes a direction based on user profile
 * Stage 2: generate-portfolio -- AI builds the allocation using profile + refinements
 */

// ── Shared types ───────────────────────────────────────────────

/** A single holding in the generated portfolio. */
export interface GeneratedHolding {
  symbol: string;
  name: string;
  /** Percentage allocation (integer, all holdings sum to 100) */
  allocation: number;
  type: 'ETF' | 'Stock' | 'Bond ETF' | 'Commodity ETF' | 'REIT';
  /** 1-2 sentence explanation of why this holding fits the portfolio specs */
  reasoning: string;
}

/** Metadata about the overall strategy. */
export interface StrategyMeta {
  name: string;
  description: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  gemType: 'Pearl' | 'Sapphire' | 'Ruby';
}

// ── Stage 1: Portfolio Recommendation ──────────────────────────

/** User's onboarding profile data sent to /api/portfolio-recommend and /api/generate-portfolio. */
export interface OnboardingProfile {
  investmentGoal: string;
  timeHorizon: string;
  riskTolerance: string;
  investmentExperience: string;
  annualIncome: string;
  netWorth: string;
}

/** Response from /api/portfolio-recommend. */
export interface PortfolioRecommendation {
  /** 2-3 paragraph natural language recommendation with reasoning */
  recommendation: string;
  suggestedRiskLevel: 'conservative' | 'moderate' | 'aggressive';
  suggestedApproach: string;
  suggestedSectors: string[];
  suggestedGeography: string;
  suggestedVolatility: 'low' | 'moderate' | 'high';
}

// ── Stage 2: Portfolio Generation ──────────────────────────────

/** The user's portfolio-specific refinement choices. */
export interface PortfolioRefinements {
  /** Comma-separated sector preferences, or "No preference" */
  sectors: string;
  /** Volatility tolerance: "low", "moderate", "high" */
  volatility: string;
  /** Geographic exposure preference */
  geography: string;
  /** Optional free-text feedback on the AI's initial recommendation */
  userFeedback?: string;
}

/** The full response from /api/generate-portfolio. */
export interface GeneratePortfolioResponse {
  holdings: GeneratedHolding[];
  strategy: StrategyMeta;
}

// ── Legacy (kept for backward compatibility during migration) ──

/** @deprecated Use OnboardingProfile + PortfolioRefinements instead. */
export interface QuestionnaireAnswers {
  goal: string;
  timeline: string;
  risk: string;
  sectors: string;
  geography: string;
  volatility: string;
}
