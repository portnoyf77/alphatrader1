import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Sparkles, Wrench, Shield, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ValidationBadge } from './ValidationBadge';
import { PortfolioThumbnail } from './PortfolioThumbnail';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { riskToGem } from '@/lib/portfolioNaming';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/lib/types';

interface PortfolioCardProps {
  portfolio: Portfolio;
  rank?: number;
  showValidationBadge?: boolean;
}

export function PortfolioCard({ portfolio, rank, showValidationBadge = false }: PortfolioCardProps) {
  const isPositive = portfolio.performance.return_30d >= 0;
  const isValidated = portfolio.validation_status === 'validated' && portfolio.validation_criteria_met;
  const gemstone = riskToGem(portfolio.risk_level);

  return (
    <Link to={`/portfolio/${portfolio.id}`}>
      <Card className="group glass-card transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {rank && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                  #{rank}
                </div>
              )}
              <PortfolioThumbnail
                sectors={portfolio.sectors}
                geoFocus={portfolio.geo_focus}
                riskLevel={portfolio.risk_level}
                gemstone={gemstone}
                size="sm"
              />
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {portfolio.name}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">{portfolio.creator_id}</p>
              </div>
            </div>
            {showValidationBadge && isValidated && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-xs border border-success/20">
                <CheckCircle2 className="h-3 w-3" />
                Validated
              </div>
            )}
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground cursor-help">
                    {portfolio.strategy_type === 'GenAI' ? (
                      <Sparkles className="h-3 w-3" />
                    ) : (
                      <Wrench className="h-3 w-3" />
                    )}
                    {portfolio.strategy_type}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {portfolio.strategy_type === 'GenAI' 
                    ? 'Portfolio created using AI-powered optimization' 
                    : 'Portfolio manually constructed by creator'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground cursor-help">
                    {portfolio.objective}
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
                  Creator has {formatCurrency(portfolio.creator_investment)} of their own capital invested
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
                      {formatPercent(portfolio.performance.return_30d)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Portfolio return over the last 30 days
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-xs text-muted-foreground mb-1">Worst Drop</p>
                    <p className="font-semibold text-destructive">
                      {formatPercent(portfolio.performance.max_drawdown, false)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[200px]">
                  Largest peak-to-trough decline - indicates potential loss during downturns
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-xs text-muted-foreground mb-1">Followers</p>
                    <div className="flex items-center gap-1 font-semibold">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {portfolio.followers_count.toLocaleString()}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Number of followers allocating to this portfolio
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Allocated</span>
              <span className="font-medium">{formatCurrency(portfolio.allocated_amount_usd)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
