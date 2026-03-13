import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, Crown, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GemDot } from '@/components/GemDot';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatPercent } from '@/lib/mockData';
import { getGemHex } from '@/lib/portfolioNaming';
import { calculateAlphaScore } from '@/lib/alphaScore';
import { cn } from '@/lib/utils';
import { Strategy } from '@/lib/types';

interface AlphaSpotlightProps {
  strategies: Strategy[];
}

export function AlphaSpotlight({ strategies }: AlphaSpotlightProps) {
  const topAlphas = [...strategies]
    .sort((a, b) => b.creator_est_monthly_earnings_usd - a.creator_est_monthly_earnings_usd)
    .slice(0, 3);

  return (
    <section className="py-24 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            Alpha Spotlight
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Top earning Alphas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            These portfolio managers have built trusted portfolios with proven track records. 
            See how much they're earning from their expertise.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {topAlphas.map((strategy) => {
            const gemHex = getGemHex(strategy.name);
            const isPositive = strategy.performance.return_30d >= 0;
            const reputationScore = calculateAlphaScore(strategy).toFixed(1);

            return (
              <Link key={strategy.id} to={`/portfolio/${strategy.id}`}>
                <Card
                  className="group glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                  style={{ borderLeft: `3px solid ${gemHex.color}` }}
                >
                  <CardContent className="p-5">
                    {/* Header: Gem + Name + Score */}
                    <div className="flex items-start gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <GemDot name={strategy.name} size={16} showTooltip />
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {strategy.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-xs shrink-0">
                            <Crown className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-primary font-mono">{reputationScore}</span>
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{strategy.creator_id}</p>
                      </div>
                    </div>

                    {/* Creator invested badge */}
                    <TooltipProvider delayDuration={200}>
                      <div className="flex items-center gap-2 mb-4">
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

                    {/* Stats grid */}
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
                          <TooltipContent className="text-xs">
                            Portfolio return over the last 30 days
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
                          <TooltipContent className="text-xs">
                            Number of followers allocating to this portfolio
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-xs text-muted-foreground mb-1">Allocated</p>
                              <p className="font-semibold">{formatCurrency(strategy.allocated_amount_usd)}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            Total capital allocated by all followers
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>

                    {/* Alpha Earnings */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Alpha Earnings (monthly est.)</span>
                        <span className="font-semibold text-success">
                          ${strategy.creator_est_monthly_earnings_usd.toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="glow-primary">
            <Link to="/alpha">
              Become an Alpha
              <Crown className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
