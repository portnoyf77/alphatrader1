import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAlpacaQuotes } from '@/hooks/useAlpacaQuotes';

export type LiveTickerHolding = {
  ticker: string;
  weight: number;
};

function formatQuotePrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type QuoteDirection = 'up' | 'down' | 'neutral';

/**
 * NBBO mid is (bid+ask)/2, so “direction” uses change since the last poll,
 * with noise scaled by the bid–ask spread.
 */
function quoteDirectionFromMid(
  bid: number,
  ask: number,
  mid: number,
  prevMid: number | undefined
): QuoteDirection {
  const spread = ask - bid;
  if (!Number.isFinite(spread) || spread <= 0 || !Number.isFinite(mid)) return 'neutral';
  if (prevMid === undefined || !Number.isFinite(prevMid)) return 'neutral';

  const eps = Math.max(spread * 0.02, 0.0001);
  const delta = mid - prevMid;
  if (delta > eps) return 'up';
  if (delta < -eps) return 'down';
  return 'neutral';
}

export function LiveTickerBar({ holdings }: { holdings: LiveTickerHolding[] }) {
  const orderedTickers = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const h of holdings) {
      const t = h.ticker.trim().toUpperCase();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }, [holdings]);

  const { quotes, loading, error } = useAlpacaQuotes(orderedTickers);

  const prevMidRef = useRef<Record<string, number>>({});

  useEffect(() => {
    for (const sym of orderedTickers) {
      const q = quotes[sym];
      if (q) prevMidRef.current[sym] = q.midPrice;
    }
  }, [quotes, orderedTickers]);

  const hasAnyQuote = orderedTickers.some((t) => quotes[t] != null);
  const showMarketClosed = orderedTickers.length > 0 && !loading && !hasAnyQuote;

  if (orderedTickers.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl overflow-hidden backdrop-blur-xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'relative flex h-2 w-2 rounded-full',
              loading ? 'bg-emerald-400/70' : 'bg-emerald-500'
            )}
            aria-hidden
          >
            <span
              className={cn(
                'absolute inset-0 rounded-full bg-emerald-400 opacity-75',
                loading ? 'animate-ping' : 'animate-pulse'
              )}
            />
          </span>
          <span className="text-[0.65rem] font-semibold tracking-widest text-muted-foreground">
            LIVE
          </span>
        </div>
        {showMarketClosed && (
          <p className="text-xs text-muted-foreground truncate">
            Market closed — live quotes unavailable right now.
          </p>
        )}
        {error && hasAnyQuote && (
          <p className="text-xs text-muted-foreground truncate" title={error}>
            Some symbols could not be updated.
          </p>
        )}
      </div>

      <div
        className="flex gap-3 overflow-x-auto py-3 px-4"
        style={{
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {orderedTickers.map((sym) => {
          const q = quotes[sym];
          const prevMid = prevMidRef.current[sym];
          const dir = q
            ? quoteDirectionFromMid(q.bidPrice, q.askPrice, q.midPrice, prevMid)
            : 'neutral';
          const barColor =
            dir === 'up' ? '#10B981' : dir === 'down' ? '#EF4444' : 'rgba(255,255,255,0.15)';

          return (
            <div
              key={sym}
              className="flex-shrink-0 flex flex-col gap-1 min-w-[7.5rem] rounded-lg px-3 py-2"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.05)',
                scrollSnapAlign: 'start',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">{sym}</span>
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: barColor }}
                  title={
                    dir === 'up'
                      ? 'Mid quote up vs last update (bid/ask context)'
                      : dir === 'down'
                        ? 'Mid quote down vs last update (bid/ask context)'
                        : 'No change yet vs last update'
                  }
                />
              </div>
              <span className="font-mono text-sm text-foreground tabular-nums">
                {q ? formatQuotePrice(q.midPrice) : loading ? '…' : '—'}
              </span>
              {q && (
                <div className="text-[0.65rem] text-muted-foreground/90 font-mono tabular-nums leading-tight">
                  B {formatQuotePrice(q.bidPrice)} · A {formatQuotePrice(q.askPrice)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
