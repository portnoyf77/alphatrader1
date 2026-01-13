import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Sparkles, Wrench, Pause, Globe, Laptop, Heart, Leaf, Zap, DollarSign, Shield, BarChart3, Gem } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatPercent } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import type { Strategy, GeoFocus, RiskLevel } from '@/lib/types';

// Map sectors to icons
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
  'Dividend': DollarSign,
  'Income': DollarSign,
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
  'Commodities': Gem,
};

const geoLabels: Record<GeoFocus, { label: string; flag: string; tooltip: string }> = {
  'US': { label: 'US', flag: '🇺🇸', tooltip: 'Focused on United States markets' },
  'Global': { label: 'Global', flag: '🌍', tooltip: 'Diversified across global markets' },
  'Emerging Markets': { label: 'EM', flag: '🌏', tooltip: 'Focused on emerging market economies' },
  'International': { label: 'Intl', flag: '🌐', tooltip: 'International developed markets excluding US' },
};

const riskConfig: Record<RiskLevel, { label: string; className: string; tooltip: string }> = {
  'Low': { label: 'Low Risk', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', tooltip: 'Conservative strategy focused on preserving your money' },
  'Medium': { label: 'Med Risk', className: 'bg-violet-500/10 text-violet-400 border-violet-500/20', tooltip: 'Balanced approach — some ups and downs expected' },
  'High': { label: 'High Risk', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20', tooltip: 'Aggressive growth — bigger swings, bigger potential gains' },
};

interface StrategyCardProps {
  strategy: Strategy;
  rank?: number;
}

export function StrategyCard({ strategy, rank }: StrategyCardProps) {
  const isPositive = strategy.performance.return_30d >= 0;
  const isPaused = strategy.new_allocations_paused;
  const geoInfo = geoLabels[strategy.geo_focus];
  const riskInfo = riskConfig[strategy.risk_level];
  const displaySectors = strategy.sectors.slice(0, 2);

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
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {strategy.strategy_name}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">{strategy.creator_id}</p>
              </div>
            </div>
            {isPaused && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning text-xs border border-warning/20">
                <Pause className="h-3 w-3" />
                Paused
              </div>
            )}
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Sector icons */}
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
              
              {/* Geo focus */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground cursor-help">
                    <span>{geoInfo.flag}</span>
                    {geoInfo.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {geoInfo.tooltip}
                </TooltipContent>
              </Tooltip>

              {/* Risk level */}
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

              {/* Strategy type */}
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
                    ? 'Built with AI-powered optimization' 
                    : 'Manually constructed by creator'}
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
