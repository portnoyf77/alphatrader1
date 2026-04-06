import { useEffect, useState } from 'react';
import { getNews, type AlpacaNewsArticle } from '@/lib/alpacaClient';

export type UseAlpacaNewsResult = {
  articles: AlpacaNewsArticle[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Fetches news from Alpaca. Optionally filtered by symbols.
 * Refreshes every 60s while mounted.
 */
export function useAlpacaNews(symbols?: string[], limit = 20): UseAlpacaNewsResult {
  const [articles, setArticles] = useState<AlpacaNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const symKey = symbols ? symbols.sort().join(',') : '';
  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetchNews() {
      if (!cancelled) setLoading(true);
      try {
        const data = await getNews(symbols, limit);
        if (!cancelled) {
          setArticles(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load news');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNews();
    const interval = setInterval(fetchNews, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symKey, limit, tick]);

  return { articles, loading, error, refetch };
}
