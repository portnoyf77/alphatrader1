import { useEffect, useState } from 'react';
import { getBars, type AlpacaBar } from '@/lib/alpacaClient';
import { cn } from '@/lib/utils';

type Period = { label: string; timeframe: string; limit: number };

const PERIODS: Period[] = [
  { label: '1W', timeframe: '1Day', limit: 5 },
  { label: '1M', timeframe: '1Day', limit: 22 },
  { label: '3M', timeframe: '1Day', limit: 66 },
  { label: '6M', timeframe: '1Day', limit: 132 },
  { label: '1Y', timeframe: '1Day', limit: 252 },
];

function MiniChart({ bars, width = 400, height = 140 }: { bars: AlpacaBar[]; width?: number; height?: number }) {
  if (bars.length < 2) return null;

  const closes = bars.map((b) => b.c);
  const minVal = Math.min(...closes);
  const maxVal = Math.max(...closes);
  const range = maxVal - minVal || 1;
  const pad = 8;

  const points = bars.map((b, i) => {
    const x = pad + (i / (bars.length - 1)) * (width - 2 * pad);
    const y = pad + (1 - (b.c - minVal) / range) * (height - 2 * pad);
    return `${x},${y}`;
  });

  const isPositive = bars[bars.length - 1].c >= bars[0].c;
  const stroke = isPositive ? '#10B981' : '#EF4444';

  const firstX = pad;
  const lastX = pad + ((bars.length - 1) / (bars.length - 1)) * (width - 2 * pad);
  const areaPath = `M${points[0]} ${points.slice(1).join(' ')} L${lastX},${height - pad} L${firstX},${height - pad} Z`;

  const change = bars[bars.length - 1].c - bars[0].c;
  const changePct = (change / bars[0].c) * 100;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`chartGrad-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.15" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#chartGrad-${isPositive ? 'up' : 'down'})`} />
        <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-xs text-muted-foreground font-mono">
          ${((bars?.[0]?.c ?? 0)).toFixed(2)}
        </span>
        <span className={cn('text-xs font-mono font-medium', isPositive ? 'text-emerald-400' : 'text-red-400')}>
          {(change ?? 0) >= 0 ? '+' : ''}{((change ?? 0)).toFixed(2)} ({(changePct ?? 0) >= 0 ? '+' : ''}{((changePct ?? 0)).toFixed(2)}%)
        </span>
        <span className="text-xs text-foreground font-mono font-semibold">
          ${((bars?.[bars.length - 1]?.c ?? 0)).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export function StockChart({ symbol }: { symbol: string }) {
  const [bars, setBars] = useState<AlpacaBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(PERIODS[1]); // 1M default

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getBars(symbol, period.timeframe, period.limit)
      .then((data) => {
        if (!cancelled) { setBars(data); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed'); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [symbol, period]);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-foreground">{symbol}</span>
          {bars.length > 0 && (
            <span className="font-mono text-sm text-foreground">${((bars?.[bars.length - 1]?.c ?? 0)).toFixed(2)}</span>
          )}
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-colors',
                period.label === p.label
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[140px] text-sm text-muted-foreground">Loading chart...</div>
      ) : error ? (
        <div className="flex items-center justify-center h-[140px] text-sm text-red-400">{error}</div>
      ) : bars.length < 2 ? (
        <div className="flex items-center justify-center h-[140px] text-sm text-muted-foreground">Not enough data</div>
      ) : (
        <MiniChart bars={bars} />
      )}
    </div>
  );
}
