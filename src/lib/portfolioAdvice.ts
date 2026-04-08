/**
 * Per-question AI advice for the portfolio creation wizard.
 * Backend: POST /api/portfolio-advice
 */
import type { OnboardingProfile } from '@/lib/portfolioTypes';
import { serverlessApiUrl } from '@/lib/serverlessApiUrl';

export type PortfolioAdviceResponse = {
  suggestedValue: unknown;
  reasoning: string;
};

export async function getPortfolioAdvice(
  profile: OnboardingProfile | null,
  currentQuestion: string,
  previousAnswers: Record<string, unknown>,
): Promise<PortfolioAdviceResponse | null> {
  let res: Response;
  try {
    res = await fetch(serverlessApiUrl('/api/portfolio-advice'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, currentQuestion, previousAnswers }),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  try {
    const data = (await res.json()) as Partial<PortfolioAdviceResponse>;
    if (!data || typeof data.reasoning !== 'string') return null;
    return {
      suggestedValue: data.suggestedValue,
      reasoning: data.reasoning,
    };
  } catch {
    return null;
  }
}
