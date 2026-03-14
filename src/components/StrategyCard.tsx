import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Pause, Globe, Laptop, Heart, Leaf, Zap, DollarSign, Shield, BarChart3, Crown, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatPercent } from '@/lib/mockData';
import { getGemHex, getGemFromName } from '@/lib/portfolioNaming';
import { GemDot } from '@/components/GemDot';
import { calculateAlphaScore } from '@/lib/alphaScore';
import { cn } from '@/lib/utils';
import type { Strategy, GeoFocus, RiskLevel } from '@/lib/types';

// Map sectors to monochrome Lucide icons
const sectorIcons: Record<string, React.ElementType> = {
  'Technology': Laptop,
  'Semiconductors': Laptop,
  'Innovation': Laptop,
  'Clean Tech': Laptop,
  'Healthcare': Heart,
  'Biotech': Heart,
  'Genomics': Heart,
  'Med Devices': Heart,
  'Clean Energy': Leaf,
  'Solar': Leaf,
  'Batteries': Zap,
  'Dividend': Coins,
  'Income': Coins,
  'REITs': DollarSign,
  'Bonds': Shield,
  'Long Bonds': Shield,
  'Inflation Protected': Shield,
  'Intl Bonds': Shield,
  'International': Globe,
  'Emerging Markets': Globe,
  'Intl Value': Globe,
  'Broad Market': BarChart3,
  'Value': TrendingUp,
  'Large Value': TrendingUp,
  'Small Value': TrendingUp,
  'Momentum': TrendingUp,
  'Commodities': BarChart3,
  'Global': Globe,
  'Consumer': BarChart3,
};

const riskConfig: Record<RiskLevel, { label: string; className: string; tooltip: string }> = {
  'Low': { label: 'Conservative', className: 'bg-slate-300/10 text-slate-300 border-slate-300/20', tooltip: 'Conservative portfolio focused on preserving your money' },
  'Medium': { label: 'Moderate', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', tooltip: 'Balanced approach — some ups and downs expected' },
  'High': { label: 'Aggressive', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20', tooltip: 'Aggressive growth — bigger swings, bigger potential gains' },
};

const turnoverTooltips: Record<string, string> = {
  'low': 'Trades rarely — lower fees, more tax-efficient',
  'medium': 'Trades occasionally — moderate activity',
  'high': 'Trades often — may have higher fees and tax impact',
};

interface StrategyCardProps {
  strategy: Strategy;
  rank?: number;
}

export function StrategyCard({ strategy, rank }: StrategyCardProps) {
  const isPositive = strategy.performance.return_30d >= 0;
  const isPaused = strategy.new_allocations_paused;
  const riskInfo = riskConfig[strategy.risk_level];
  const displaySectors = strategy.sectors.slice(0, 3);
  
  const gemHex = getGemHex(strategy.name);
  const reputationScore = calculateAlphaScore(strategy).toFixed(1);

  return (
    <Link to={`/portfolio/${strategy.id}`}>
      <Card
        className="group glass-card transition-all duration-300"
        style={{ borderLeft: `3px solid ${gemHex.color}` }}
      >
        <CardContent className="p-5">
          {/* Header: Gem + Name + Score */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <GemDot name={strategy.name} />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {strategy.name}
                </h3>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-xs cursor-help shrink-0">
                        <Crown className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-primary font-mono">{reputationScore}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-[200px]">
                      Alpha reputation score based on performance, consistency, track record, and follower count
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground font-mono">{strategy.creator_id}</p>
            </div>
            <div className="flex items-center gap-2">
              {isPaused && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning text-xs border border-warning/20">
                  <Pause className="h-3 w-3" />
                  Paused
                </div>
              )}
            </div>
          </div>

          {/* Tags: Sectors + Risk Level */}
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {displaySectors.map((sector, idx) => {
                const Icon = sectorIcons[sector] || BarChart3;
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground cursor-help">
                        <Icon className="h-3.5 w-3.5" />
                        {sector}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Invests in {sector}
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs border cursor-help", riskInfo.className)}>
                    {riskInfo.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[200px]">
                  {riskInfo.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Stats grid */}
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-3 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help flex flex-col justify-between h-10">
                    <p className="text-xs text-muted-foreground leading-none">30d Return</p>
                    <div className={cn(
                      "flex items-center gap-1 font-semibold",
                      isPositive ? "text-success" : "text-destructive"
                    )}>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 shrink-0" />
                      )}
                      {formatPercent(strategy.performance.return_30d)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  How much this portfolio gained or lost in the past 30 days
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help flex flex-col justify-between h-10">
                    <p className="text-xs text-muted-foreground leading-none">Worst Drop</p>
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
                  <div className="cursor-help flex flex-col justify-between h-10">
                    <p className="text-xs text-muted-foreground leading-none">Followers</p>
                    <div className="flex items-center gap-1 font-semibold">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      {strategy.followers_count.toLocaleString()}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  How many people have put money into this portfolio
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Bottom stats */}
          <TooltipProvider delayDuration={200}>
            <div className="mt-4 pt-4 border-t border-border/50 space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help">
                    <span className="text-muted-foreground">Alpha's Own Investment</span>
                    <span className="font-medium text-success">{formatCurrency(strategy.creator_investment)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  How much the Alpha has personally invested in this portfolio — skin in the game
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help">
                    <span className="text-muted-foreground">Total Allocated</span>
                    <span className="font-medium">{formatCurrency(strategy.allocated_amount_usd)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  Total money from all followers combined
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help">
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
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">
                  {turnoverTooltips[strategy.turnover_estimate] || 'How often the portfolio trades'}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </Link>
  );
}
