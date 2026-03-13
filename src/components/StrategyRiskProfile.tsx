import { Shield, TrendingUp, RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Strategy } from '@/lib/types';

interface StrategyRiskProfileProps {
  strategy: Strategy;
}

export function StrategyRiskProfile({ strategy }: StrategyRiskProfileProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Profile & Constraints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider delayDuration={200}>
          {/* Allowed Assets */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Allowed Assets</p>
            <div className="flex flex-wrap gap-2">
              {strategy.allowed_assets.map((asset, idx) => (
                <span key={idx} className="px-2 py-1 rounded-md bg-secondary text-xs">
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* Constraints Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg bg-secondary/50 cursor-help">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Max Sector Exposure
                  </div>
                  <p className="font-semibold">{strategy.max_single_sector_exposure_pct}%</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[200px]">
                Maximum allocation allowed to any single sector to prevent concentration risk
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg bg-secondary/50 cursor-help">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <RefreshCw className="h-4 w-4" />
                    Turnover
                  </div>
                  <p className={cn(
                    "font-semibold capitalize",
                    strategy.max_turnover === 'low' && "text-success",
                    strategy.max_turnover === 'medium' && "text-warning",
                    strategy.max_turnover === 'high' && "text-destructive"
                  )}>
                    {strategy.max_turnover}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[200px]">
                Expected trading frequency - low means fewer trades and lower costs
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg bg-secondary/50 cursor-help">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    Leverage
                  </div>
                  <div className="flex items-center gap-2">
                    {strategy.leverage_allowed ? (
                      <>
                        <Check className="h-4 w-4 text-warning" />
                        <span className="font-semibold text-warning">Allowed</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-success" />
                        <span className="font-semibold text-success">Not Allowed</span>
                      </>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[200px]">
                {strategy.leverage_allowed 
                  ? 'This portfolio may use leverage to amplify returns (and losses)'
                  : 'This portfolio does not use leverage, limiting downside risk'}
              </TooltipContent>
            </Tooltip>

          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
