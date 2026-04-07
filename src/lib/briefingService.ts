/**
 * Client-side service for the morning market briefing.
 *
 * Fetches a fresh briefing from /api/morning-briefing and caches it
 * in sessionStorage so it only runs once per browser session.
 */

import { serverlessApiUrl, explainServerlessNetworkError } from '@/lib/serverlessApiUrl';

const CACHE_KEY = 'alpha_morning_briefing';

interface CachedBriefing {
  briefing: string;
  generatedAt: string;
  cachedDate: string; // YYYY-MM-DD
}

/**
 * Check if we already have a briefing for today's session.
 * Returns the cached briefing text, or null if none/stale.
 */
function getCachedBriefing(): string | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedBriefing = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (cached.cachedDate === today) return cached.briefing;
    return null; // stale -- different day
  } catch {
    return null;
  }
}

function cacheBriefing(briefing: string, generatedAt: string): void {
  try {
    const entry: CachedBriefing = {
      briefing,
      generatedAt,
      cachedDate: new Date().toISOString().slice(0, 10),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable -- ignore
  }
}

/**
 * Check if now is a reasonable time to show a market briefing.
 * Returns true on weekdays (Mon-Fri). Doesn't block on weekends,
 * but the briefing content will be less useful.
 */
function isTradingDay(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5; // Mon=1 through Fri=5
}

/**
 * Fetch the morning briefing. Returns cached version if available,
 * otherwise calls the API. Returns null on error or weekends.
 */
export async function getMorningBriefing(): Promise<string | null> {
  // Check cache first
  const cached = getCachedBriefing();
  if (cached) return cached;

  // Skip on weekends (markets closed)
  if (!isTradingDay()) return null;

  try {
    const res = await fetch(serverlessApiUrl('/api/morning-briefing'));
    if (!res.ok) {
      console.warn('[briefingService] API returned', res.status);
      return null;
    }

    const data = await res.json();
    if (data.briefing) {
      cacheBriefing(data.briefing, data.generatedAt);
      return data.briefing;
    }
    return null;
  } catch (err) {
    console.warn('[briefingService]', explainServerlessNetworkError(err));
    return null;
  }
}
