import { Link } from 'react-router-dom';
import { Users, TrendingUp } from 'lucide-react';
import { GemDot } from '@/components/GemDot';
import { getGemHex } from '@/lib/portfolioNaming';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/lib/types';

const riskLabels: Record<string, string> = {
  Low: 'Conservative',
  Medium: 'Moderate',
  High: 'Aggressive',
};

interface TopPerformerCardProps {
  portfolio: Portfolio;
  rank: number;
  returnValue: number;
  timeLabel: string;
  isAnimating?: boolean;
}

export function TopPerformerCard({ portfolio, rank, returnValue, timeLabel, isAnimating }: TopPerformerCardProps) {
  const { color, glow } = getGemHex(portfolio.name);
  const isPositive = returnValue >= 0;
  const isFirst = rank === 1;

  return (
    <Link
      to={`/portfolio/${portfolio.id}`}
      className={cn(
        "flex-1 min-w-[180px] group transition-all duration-300",
        isAnimating && "animate-fade-in"
      )}
    >
      <div
        className={cn(
          "rounded-2xl text-card-foreground h-full group glass-card",
          "cursor-pointer transition-all duration-300",
        )}
        style={{
          borderLeft: `3px solid ${color}`,
          ...(isFirst ? { boxShadow: `0 0 24px ${glow}, 0 4px 24px rgba(0,0,0,0.2)` } : {}),
        }}
      >
        <div className="p-4 flex flex-col gap-3">
          {/* Rank */}
          <span className={cn(
            "text-xs font-mono",
            isFirst ? "text-amber-400" : "text-muted-foreground"
          )}>
            #{rank}
          </span>

          {/* Name + Risk */}
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <GemDot name={portfolio.name} size={14} showTooltip={false} />
              <span className="font-semibold text-sm truncate" style={{ color }}>
                {portfolio.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">{portfolio.creator_id}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {riskLabels[portfolio.risk_level] || portfolio.risk_level}
              </span>
            </div>
          </div>

          {/* Return */}
          <div className="mt-1">
            <p className={cn(
              "text-2xl font-bold font-mono",
              isPositive ? "text-success" : "text-destructive"
            )}>
              {isPositive ? '+' : ''}{returnValue.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">{timeLabel}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-1 mt-auto text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{portfolio.followers_count.toLocaleString()} followers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{formatCurrency(portfolio.allocated_amount_usd)} allocated</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
