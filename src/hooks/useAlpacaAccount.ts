import { useEffect, useState } from 'react';
import { getAccountInfo, type AlpacaAccountInfo } from '@/lib/alpacaClient';

export type AccountSummary = {
  equity: number;
  cash: number;
  buyingPower: number;
  portfolioValue: number;
  lastEquity: number;
  /** Day P&L in dollars */
  dayPL: number;
  /** Day P&L as a percentage of last equity */
  dayPLPercent: number;
  status: string;
};

export type UseAlpacaAccountResult = {
  account: AccountSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function parseAccount(raw: AlpacaAccountInfo): AccountSummary {
  const equity = parseFloat(raw.equity) || 0;
  const cash = parseFloat(raw.cash) || 0;
  const buyingPower = parseFloat(raw.buying_power) || 0;
  const portfolioValue = parseFloat(raw.portfolio_value) || 0;
  const lastEquity = parseFloat(raw.last_equity) || 0;
  const dayPL = equity - lastEquity;
  const dayPLPercent = lastEquity > 0 ? (dayPL / lastEquity) * 100 : 0;
  return { equity, cash, buyingPower, portfolioValue, lastEquity, dayPL, dayPLPercent, status: raw.status };
}

/**
 * Fetches Alpaca account info. Refreshes every 30s while mounted.
 */
export function useAlpacaAccount(): UseAlpacaAccountResult {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      if (!cancelled) setLoading(true);
      try {
        const raw = await getAccountInfo();
        if (!cancelled) {
          setAccount(parseAccount(raw));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load account');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    const interval = window.setInterval(fetch, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [tick]);

  return { account, loading, error, refetch };
}
