import { useEffect, useState } from 'react';
import { Bot, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import {
  getLatestRebalanceLog,
  formatRelativeTime,
  isAgentActive,
  tradeStats,
  RebalanceLogEntry,
} from '@/lib/rebalanceService';

interface AgentActivityCardProps {
  className?: string;
}

export function AgentActivityCard({ className }: AgentActivityCardProps) {
  const [latestLog, setLatestLog] = useState<RebalanceLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const fetchLatestLog = async () => {
      try {
        const log = await getLatestRebalanceLog();
        setLatestLog(log);
        setIsActive(isAgentActive(log?.timestamp || null));
        if (log) {
          setTimeAgo(formatRelativeTime(log.timestamp));
        }
      } catch (error) {
        console.error('Failed to fetch latest rebalance log:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestLog();
    const interval = setInterval(fetchLatestLog, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4',
          className
        )}
      >
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-32 animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-28 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!latestLog) {
    return (
      <div
        className={cn(
          'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4',
          'flex flex-col items-center justify-center text-center min-h-[180px]',
          className
        )}
      >
        <Bot className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <p className="text-xs text-muted-foreground">No agent activity yet</p>
      </div>
    );
  }

  const { submitted, totalBuyValue, totalSellQty } = tradeStats(latestLog.trades);
  const buyCount = latestLog.trades.filter((t) => t.side === 'buy').length;
  const sellCount = latestLog.trades.filter((t) => t.side === 'sell').length;

  // Determine market outlook badge color
  const outlookBg =
    latestLog.overseerDecision.marketOutlook === 'bullish'
      ? 'bg-emerald-400/20 text-emerald-400'
      : latestLog.overseerDecision.marketOutlook === 'bearish'
        ? 'bg-red-400/20 text-red-400'
        : 'bg-yellow-400/20 text-yellow-400';

  // Confidence dots (1-10 scale)
  const confidenceLevel = latestLog.overseerDecision.confidence || 5;
  const filledDots = Math.ceil(confidenceLevel / 2); // 5 dots max, each represents 2 confidence points

  return (
    <div
      className={cn(
        'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4',
        className
      )}
    >
      {/* Header with status dot and title */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
          )}
        />
        <h3 className="text-xs font-semibold text-foreground">Agent Activity</h3>
      </div>

      {/* Time and badges */}
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground">{timeAgo}</div>

        {/* Market outlook and dry run badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', outlookBg)}>
            {latestLog.overseerDecision.marketOutlook.charAt(0).toUpperCase() +
              latestLog.overseerDecision.marketOutlook.slice(1)}
          </span>
          {latestLog.dryRun && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-400/20 text-blue-400">
              DRY RUN
            </span>
          )}
        </div>

        {/* Confidence dots */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                i < filledDots ? 'bg-emerald-400' : 'bg-white/20'
              )}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {confidenceLevel}/10
          </span>
        </div>

        {/* Overseer reasoning (truncated) */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {latestLog.overseerDecision.reasoning}
        </p>

        {/* Trade summary */}
        <div className="flex items-center gap-3 pt-1 border-t border-white/10">
          {buyCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">{buyCount} buys</span>
            </div>
          )}
          {sellCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span className="text-red-400">{sellCount} sells</span>
            </div>
          )}
          {buyCount === 0 && sellCount === 0 && (
            <span className="text-xs text-muted-foreground">No trades</span>
          )}
        </div>
      </div>
    </div>
  );
}
