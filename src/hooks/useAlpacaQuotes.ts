import { useEffect, useMemo, useState } from 'react';
import { getLatestQuote } from '@/lib/alpacaClient';

export type AlpacaQuotePrices = {
  bidPrice: number;
  askPrice: number;
  midPrice: number;
};

export type UseAlpacaQuotesResult = {
  quotes: Record<string, AlpacaQuotePrices>;
  loading: boolean;
  error: string | null;
};

function normalizeSymbols(symbols: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of symbols) {
    const t = s.trim().toUpperCase();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Fetches latest NBBO quotes for the given symbols (parallel, resilient per symbol).
 * Refetches every 30s while mounted.
 */
export function useAlpacaQuotes(symbols: string[]): UseAlpacaQuotesResult {
  const normalized = useMemo(() => normalizeSymbols(symbols), [symbols]);

  const [quotes, setQuotes] = useState<Record<string, AlpacaQuotePrices>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let firstFetchInCycle = true;

    async function fetchQuotes() {
      if (normalized.length === 0) {
        if (!cancelled) {
          setQuotes({});
          setLoading(false);
          setError(null);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        if (firstFetchInCycle) {
          firstFetchInCycle = false;
          setQuotes({});
        }
      }

      const results = await Promise.allSettled(
        normalized.map((sym) => getLatestQuote(sym))
      );

      if (cancelled) return;

      const next: Record<string, AlpacaQuotePrices> = {};
      let fulfilled = 0;

      results.forEach((result, i) => {
        const sym = normalized[i];
        if (result.status === 'fulfilled') {
          const q = result.value;
          const mid = (q.bidPrice + q.askPrice) / 2;
          next[sym] = {
            bidPrice: q.bidPrice,
            askPrice: q.askPrice,
            midPrice: mid,
          };
          fulfilled++;
        }
      });

      setQuotes(next);

      if (fulfilled === 0) {
        const firstRejected = results.find((r) => r.status === 'rejected') as
          | PromiseRejectedResult
          | undefined;
        const msg =
          firstRejected?.reason instanceof Error
            ? firstRejected.reason.message
            : typeof firstRejected?.reason === 'string'
              ? firstRejected.reason
              : 'Quotes unavailable';
        setError(msg);
      } else {
        setError(null);
      }

      setLoading(false);
    }

    fetchQuotes();
    const interval = window.setInterval(fetchQuotes, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [normalized]);

  return { quotes, loading, error };
}
