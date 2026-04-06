/**
 * Types for AI-generated portfolio allocations.
 *
 * Used by portfolioService.ts and the Invest.tsx / PortfolioQuestionnaire.tsx
 * components to replace the old hardcoded holdings.
 */

/** A single holding in the generated portfolio. */
export interface GeneratedHolding {
  symbol: string;
  name: string;
  /** Percentage allocation (integer, all holdings sum to 100) */
  allocation: number;
  type: 'ETF' | 'Stock' | 'Bond ETF' | 'Commodity ETF' | 'REIT';
  /** 1-2 sentence explanation of why this holding fits the investor's profile */
  reasoning: string;
}

/** Metadata about the overall strategy. */
export interface StrategyMeta {
  name: string;
  description: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  gemType: 'Pearl' | 'Sapphire' | 'Ruby';
}

/** The full response from /api/generate-portfolio. */
export interface GeneratePortfolioResponse {
  holdings: GeneratedHolding[];
  strategy: StrategyMeta;
}

/** The questionnaire answers sent to the API. */
export interface QuestionnaireAnswers {
  goal: string;
  timeline: string;
  risk: string;
  sectors: string;
  geography: string;
  volatility: string;
}
