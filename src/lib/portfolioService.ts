/**
 * Client-side service for the hybrid AI-led portfolio creation flow.
 *
 * Stage 1: getPortfolioRecommendation() -- AI proposes a direction based on profile
 * Stage 2: generatePortfolio() -- AI builds the allocation using profile + refinements
 */

import type {
  OnboardingProfile,
  PortfolioRecommendation,
  PortfolioRefinements,
  GeneratePortfolioResponse,
} from './portfolioTypes';
import { serverlessApiUrl, explainServerlessNetworkError } from '@/lib/serverlessApiUrl';

/**
 * Stage 1: Get AI's portfolio recommendation based on the user's profile.
 *
 * Call this when the user enters the portfolio creation flow. The AI
 * reads their onboarding data and proposes a starting direction with
 * clear reasoning the UI can display.
 *
 * @param profile - The user's onboarding profile data.
 * @returns AI recommendation with suggested risk level, sectors, etc.
 */
export async function getPortfolioRecommendation(
  profile: OnboardingProfile,
): Promise<PortfolioRecommendation> {
  let res: Response;
  try {
    res = await fetch(serverlessApiUrl('/api/portfolio-recommend'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
  } catch (e) {
    throw new Error(explainServerlessNetworkError(e));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(body.error || `Recommendation failed (${res.status})`);
  }

  const data: PortfolioRecommendation = await res.json();

  if (!data.recommendation) {
    throw new Error('AI returned an empty recommendation. Please try again.');
  }

  return data;
}

/**
 * Stage 2: Generate the actual portfolio allocation.
 *
 * Call this after the user has reviewed the AI's recommendation and
 * refined their portfolio preferences. This fires during the
 * crystallization animation.
 *
 * @param profile - The user's onboarding profile data.
 * @param refinements - The user's portfolio-specific choices (sectors, volatility, geography).
 * @returns Generated holdings and strategy metadata.
 */
export async function generatePortfolio(
  profile: OnboardingProfile,
  refinements: PortfolioRefinements,
): Promise<GeneratePortfolioResponse> {
  let res: Response;
  try {
    res = await fetch(serverlessApiUrl('/api/generate-portfolio'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, refinements }),
    });
  } catch (e) {
    throw new Error(explainServerlessNetworkError(e));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(body.error || `Portfolio generation failed (${res.status})`);
  }

  const data: GeneratePortfolioResponse = await res.json();

  if (!data.holdings || data.holdings.length === 0) {
    throw new Error('AI returned an empty portfolio. Please try again.');
  }

  return data;
}
