import { useEffect, useState } from 'react';
import { getPositions, type AlpacaPosition } from '@/lib/alpacaClient';

export type PositionSummary = {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
};

export type UseAlpacaPositionsResult = {
  positions: PositionSummary[];
  totalMarketValue: number;
  totalUnrealizedPL: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function parsePosition(raw: AlpacaPosition): PositionSummary {
  const qty = parseFloat(raw.qty) || 0;
  const avgEntryPrice = parseFloat(raw.avg_entry_price) || 0;
  const currentPrice = parseFloat(raw.current_price) || 0;
  const marketValue = parseFloat(raw.market_value ?? String(qty * currentPrice)) || 0;
  const unrealizedPL = parseFloat(raw.unrealized_pl) || 0;
  const costBasis = qty * avgEntryPrice;
  const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
  return { symbol: raw.symbol, qty, avgEntryPrice, currentPrice, marketValue, unrealizedPL, unrealizedPLPercent };
}

/**
 * Fetches Alpaca open positions. Refreshes every 30s while mounted.
 */
export function useAlpacaPositions(): UseAlpacaPositionsResult {
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      if (!cancelled) setLoading(true);
      try {
        const raw = await getPositions();
        if (!cancelled) {
          setPositions(raw.map(parsePosition));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load positions');
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

  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalUnrealizedPL = positions.reduce((sum, p) => sum + p.unrealizedPL, 0);

  return { positions, totalMarketValue, totalUnrealizedPL, loading, error, refetch };
}
