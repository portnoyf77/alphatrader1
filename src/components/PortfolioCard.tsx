import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Sparkles, Wrench, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatPercent } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/lib/types';

interface PortfolioCardProps {
  portfolio: Portfolio;
  rank?: number;
}

export function PortfolioCard({ portfolio, rank }: PortfolioCardProps) {
  const isPositive = portfolio.performance.return_30d >= 0;

  return (
    <Link to={`/portfolio/${portfolio.id}`}>
      <Card className="group glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {rank && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                  #{rank}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {portfolio.name}
                </h3>
                <p className="text-sm text-muted-foreground">{portfolio.creator_name}</p>
              </div>
            </div>
            <StatusBadge status={portfolio.status} />
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
              {portfolio.strategy_type === 'GenAI' ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <Wrench className="h-3 w-3" />
              )}
              {portfolio.strategy_type}
            </span>
            <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
              {portfolio.objective}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-xs text-success border border-success/20">
              <Shield className="h-3 w-3" />
              Creator invested
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">30d Return</p>
              <div className={cn(
                "flex items-center gap-1 font-semibold",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatPercent(portfolio.performance.return_30d)}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
              <p className="font-semibold text-destructive">
                {formatPercent(portfolio.performance.max_drawdown, false)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Investors</p>
              <div className="flex items-center gap-1 font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                {portfolio.investors_count.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Allocated</span>
              <span className="font-medium">{formatCurrency(portfolio.allocated_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}