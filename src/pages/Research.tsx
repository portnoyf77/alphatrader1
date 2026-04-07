import { useState, useEffect, useMemo } from 'react';
import { Newspaper, RefreshCw, Search, ExternalLink, TrendingUp, TrendingDown, Clock, Tag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';
import { getNews, getLatestQuote, type AlpacaNewsArticle } from '@/lib/alpacaClient';
import { useAlpacaPositions } from '@/hooks/useAlpacaPositions';
import { formatCurrency } from '@/lib/formatters';

// ── Watchlist Manager ──

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'SPY', 'QQQ'];

function getWatchlist(): string[] {
  try {
    const stored = localStorage.getItem('alphaTraderWatchlist');
    if (stored) return JSON.parse(stored);
  } catch { /* fall through */ }
  return DEFAULT_WATCHLIST;
}

function setWatchlist(symbols: string[]) {
  localStorage.setItem('alphaTraderWatchlist', JSON.stringify(symbols));
}

// ── Quote Widget ──

type QuoteData = { symbol: string; bid: number; ask: number; mid: number };

function WatchlistQuotes({ symbols }: { symbols: string[] }) {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      if (!cancelled) setLoading(true);
      const results = await Promise.allSettled(
        symbols.slice(0, 12).map(async (sym) => {
          const q = await getLatestQuote(sym);
          return { symbol: sym, bid: q.bidPrice, ask: q.askPrice, mid: (q.bidPrice + q.askPrice) / 2 };
        }),
      );
      if (cancelled) return;
      const good = results
        .filter((r): r is PromiseFulfilledResult<QuoteData> => r.status === 'fulfilled')
        .map((r) => r.value);
      setQuotes(good);
      setLoading(false);
    }

    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbols]);

  if (loading && quotes.length === 0) {
    return <div className="text-sm text-muted-foreground py-3">Loading quotes...</div>;
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {quotes.map((q) => (
        <div
          key={q.symbol}
          className="rounded-lg p-2.5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="font-mono font-semibold text-xs text-foreground">{q.symbol}</div>
          <div className="font-mono text-sm text-foreground mt-0.5">${q.mid.toFixed(2)}</div>
          <div className="text-[0.6rem] text-muted-foreground mt-0.5">
            B: ${q.bid.toFixed(2)} / A: ${q.ask.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── News Feed ──

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NewsCard({ article, watchlist }: { article: AlpacaNewsArticle; watchlist: string[] }) {
  const relevantSymbols = article.symbols.filter((s) => watchlist.includes(s));
  const thumbImg = article.images?.find((img) => img.size === 'small') ?? article.images?.find((img) => img.size === 'thumb') ?? article.images?.[0];

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden transition-colors hover:bg-white/[0.03] group"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex gap-4 p-4">
        {thumbImg?.url && (
          <div
            className="w-28 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${thumbImg.url})` }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {article.headline}
            </h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          </div>
          {article.summary && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{article.summary}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[0.65rem] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeSince(article.created_at)}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">{article.source}</span>
            {relevantSymbols.length > 0 && (
              <div className="flex gap-1">
                {relevantSymbols.map((s) => (
                  <span
                    key={s}
                    className="text-[0.6rem] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'rgb(167, 139, 250)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

// ── Main Page ──

export default function Research() {
  const [watchlist, setWatchlistState] = useState(getWatchlist);
  const [newSymbol, setNewSymbol] = useState('');
  const [news, setNews] = useState<AlpacaNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsFilter, setNewsFilter] = useState<'all' | 'watchlist'>('watchlist');
  const { positions } = useAlpacaPositions();

  // Auto-add position symbols to watchlist
  useEffect(() => {
    if (positions.length === 0) return;
    const posSymbols = positions.map((p) => p.symbol);
    const merged = [...new Set([...watchlist, ...posSymbols])];
    if (merged.length !== watchlist.length) {
      setWatchlistState(merged);
      setWatchlist(merged);
    }
  }, [positions]);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const symbols = newsFilter === 'watchlist' ? watchlist : undefined;
      const articles = await getNews(symbols, 30);
      setNews(articles);
    } catch {
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [watchlist, newsFilter]);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || watchlist.includes(sym)) { setNewSymbol(''); return; }
    const updated = [...watchlist, sym];
    setWatchlistState(updated);
    setWatchlist(updated);
    setNewSymbol('');
  };

  const handleRemoveSymbol = (sym: string) => {
    const updated = watchlist.filter((s) => s !== sym);
    setWatchlistState(updated);
    setWatchlist(updated);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <Zap className="h-7 w-7 text-primary" />
              Market Research
            </h1>
            <p className="text-muted-foreground">
              Live quotes and news for your watchlist. Auto-updates every 30s (quotes) and 60s (news).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchNews} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', newsLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Watchlist Management */}
        <div
          className="mb-6 rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Watchlist
            </h2>
            <form onSubmit={handleAddSymbol} className="flex gap-2">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Add symbol..."
                className="h-8 w-28 rounded-lg px-3 text-xs bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
                Add
              </Button>
            </form>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {watchlist.map((sym) => (
              <button
                key={sym}
                onClick={() => handleRemoveSymbol(sym)}
                className="text-xs font-mono px-2.5 py-1 rounded-lg transition-colors hover:bg-red-400/15 hover:text-red-400"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                title={`Remove ${sym}`}
              >
                {sym} &times;
              </button>
            ))}
          </div>
          <WatchlistQuotes symbols={watchlist} />
        </div>

        {/* News Feed */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-muted-foreground" />
              News Feed
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setNewsFilter('watchlist')}
                className={cn(
                  'px-3 py-1 text-xs rounded-lg transition-colors',
                  newsFilter === 'watchlist' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Watchlist
              </button>
              <button
                onClick={() => setNewsFilter('all')}
                className={cn(
                  'px-3 py-1 text-xs rounded-lg transition-colors',
                  newsFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                All Markets
              </button>
            </div>
          </div>

          {newsLoading && news.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading news...</div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No news found. Try adding more symbols to your watchlist or switching to "All Markets".
            </div>
          ) : (
            <div className="grid gap-3">
              {news.map((article) => (
                <NewsCard key={article.id} article={article} watchlist={watchlist} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
