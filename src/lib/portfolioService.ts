/**
 * Client-side service for AI portfolio generation.
 *
 * Calls /api/generate-portfolio with questionnaire answers and returns
 * personalised holdings + strategy metadata from Claude.
 */

import type {
  QuestionnaireAnswers,
  GeneratePortfolioResponse,
} from './portfolioTypes';
import { serverlessApiUrl, explainServerlessNetworkError } from '@/lib/serverlessApiUrl';

/**
 * Request an AI-generated portfolio allocation.
 *
 * @param answers - The user's 6 questionnaire answers.
 * @returns The generated portfolio, or throws with a user-friendly message.
 *
 * Usage in Invest.tsx or PortfolioQuestionnaire.tsx:
 *
 *   const result = await generatePortfolio(answers);
 *   // result.holdings  -> GeneratedHolding[]  (replaces enhancedGeneratedHoldings)
 *   // result.strategy  -> StrategyMeta        (name, description, gemType, riskLevel)
 */
export async function generatePortfolio(
  answers: QuestionnaireAnswers,
): Promise<GeneratePortfolioResponse> {
  let res: Response;
  try {
    res = await fetch(serverlessApiUrl('/api/generate-portfolio'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
  } catch (e) {
    throw new Error(explainServerlessNetworkError(e));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(body.error || `Portfolio generation failed (${res.status})`);
  }

  const data: GeneratePortfolioResponse = await res.json();

  // Sanity check: make sure we got holdings back
  if (!data.holdings || data.holdings.length === 0) {
    throw new Error('AI returned an empty portfolio. Please try again.');
  }

  return data;
}
