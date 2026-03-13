import type { Portfolio } from './types';

/**
 * Calculate Alpha reputation score (1.0–5.0)
 * Factors: performance, consistency, track record length, follower trust
 */
export function calculateAlphaScore(portfolio: Portfolio): number {
  // Performance component: rewards positive returns, penalizes losses
  const avgReturn = portfolio.performance.return_30d || 0;
  const performanceBase = Math.max(-1, Math.min(1, avgReturn / 5)) * 1.5;
  // Range: -1.5 to +1.5

  // Consistency component
  const consistency = (portfolio.performance.consistency_score || 50) / 100 * 1.5;
  // Range: 0 to 1.5

  // Track record length
  const daysActive = Math.floor(
    (Date.now() - new Date(portfolio.created_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const trackRecord = Math.min(daysActive / 365, 1) * 1.0;
  // Range: 0 to 1.0

  // Follower trust
  const followers = portfolio.followers_count || 0;
  const followerBonus = Math.min(followers / 1000, 1) * 0.5;
  // Range: 0 to 0.5

  const raw = performanceBase + consistency + trackRecord + followerBonus;
  return Math.max(1.0, Math.min(5.0, Number(raw.toFixed(1))));
}
