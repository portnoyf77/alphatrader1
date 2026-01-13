import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Sparkles, Wrench, Shield, CheckCircle2, Pause } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { ValidationBadge } from './ValidationBadge';
import { StrategyThumbnail } from './StrategyThumbnail';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatPercent } from '@/lib/mockData';
import { getGemstoneForSector } from '@/lib/portfolioNaming';
import { cn } from '@/lib/utils';
import type { Strategy } from '@/lib/types';

interface StrategyCardProps {
  strategy: Strategy;
  rank?: number;
  showValidationBadge?: boolean;
}

export function StrategyCard({ strategy, rank, showValidationBadge = false }: StrategyCardProps) {
  const isPositive = strategy.performance.return_30d >= 0;
  const isValidated = strategy.validation_status === 'validated' && strategy.validation_criteria_met;
  const gemstone = strategy.sectors[0] ? getGemstoneForSector(strategy.sectors[0]) : 'Quartz';
  const isPaused = strategy.new_allocations_paused;

  return (
    <Link to={`/strategy/${strategy.id}`}>
      <Card className="group glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {rank && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                  #{rank}
                </div>
              )}
              <StrategyThumbnail
                sectors={strategy.sectors}
                geoFocus={strategy.geo_focus}
                riskLevel={strategy.risk_level}
                gemstone={gemstone}
                size="sm"
              />
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {strategy.strategy_name}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">{strategy.creator_id}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {showValidationBadge && isValidated ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-xs border border-success/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Validated
                </div>
              ) : (
                <ValidationBadge status={strategy.validation_status} />
              )}
              {isPaused && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning text-xs border border-warning/20">
                  <Pause className="h-3 w-3" />
                  Paused
                </div>
              )}
            </div>
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground cursor-help">
                    {strategy.strategy_type === 'GenAI' ? (
                      <Sparkles className="h-3 w-3" />
                    ) : (
                      <Wrench className="h-3 w-3" />
                    )}
                    {strategy.strategy_type}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {strategy.strategy_type === 'GenAI' 
                    ? 'Strategy created using AI-powered optimization' 
                    : 'Strategy manually constructed by creator'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground cursor-help">
                    {strategy.objective}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Primary investment objective
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-xs text-success border border-success/20 cursor-help">
                    <Shield className="h-3 w-3" />
                    Creator invested
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[200px]">
                  Creator has {formatCurrency(strategy.creator_investment)} of their own capital invested
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-3 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
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
                      {formatPercent(strategy.performance.return_30d)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  How much this strategy gained or lost in the past 30 days
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                    <p className="font-semibold text-destructive">
                      {formatPercent(strategy.performance.max_drawdown, false)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  The biggest drop from a high point — shows how much you could lose in a bad stretch
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-xs text-muted-foreground mb-1">Followers</p>
                    <div className="flex items-center gap-1 font-semibold">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {strategy.followers_count.toLocaleString()}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  How many people have put money into this strategy
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Allocated</span>
              <span className="font-medium">{formatCurrency(strategy.allocated_amount_usd)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Turnover</span>
              <span className={cn(
                "font-medium capitalize",
                strategy.turnover_estimate === 'low' && "text-success",
                strategy.turnover_estimate === 'medium' && "text-warning",
                strategy.turnover_estimate === 'high' && "text-destructive"
              )}>
                {strategy.turnover_estimate}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
