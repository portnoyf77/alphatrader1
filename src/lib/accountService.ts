/**
 * Client service for direct Alpaca account data.
 *
 * Fetches raw account + positions from /api/account
 * (no Claude call, fast response).
 * Used by Dashboard, Portfolio, and detail pages.
 */

// ── Types ───────────────────────────────────────────────────────

export interface AccountData {
  equity: number;
  cash: number;
  buyingPower: number;
  portfolioValue: number;
  dayChangeAmt: number;
  dayChangePct: number;
  status: string;
  tradingBlocked: boolean;
  patternDayTrader: boolean;
}

export interface Position {
  symbol: string;
  name: string;
  qty: number;
  avgEntry: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPct: number;
  allocationPct: number;
  side: string;
  assetClass: string;
}

export interface HistoryPoint {
  date: string;
  equity: number;
  pl: number;
  plPct: number;
}

export interface AccountSummary {
  account: AccountData;
  positions: Position[];
  totalUnrealizedPL: number;
  positionCount: number;
  history: HistoryPoint[];
}

// ── API calls ───────────────────────────────────────────────────

/**
 * Fetch full account summary (account + positions + 1M history).
 * This is the primary data source for Dashboard and Portfolio pages.
 */
export async function getAccountSummary(): Promise<AccountSummary> {
  const res = await fetch('/api/account');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch account' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * React Query hook key for account data.
 * Use with: useQuery({ queryKey: ACCOUNT_QUERY_KEY, queryFn: getAccountSummary })
 */
export const ACCOUNT_QUERY_KEY = ['account-summary'] as const;
