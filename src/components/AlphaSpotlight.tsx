import { Link } from 'react-router-dom';
import { TrendingUp, Users, DollarSign, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PortfolioThumbnail } from '@/components/PortfolioThumbnail';
import { formatCurrency } from '@/lib/mockData';
import { getGemstoneForSector } from '@/lib/portfolioNaming';
import { Strategy } from '@/lib/types';

interface AlphaSpotlightProps {
  strategies: Strategy[];
}

export function AlphaSpotlight({ strategies }: AlphaSpotlightProps) {
  // Sort by earnings and take top 3
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
            These portfolio managers have built trusted strategies with proven track records. 
            See how much they're earning from their expertise.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {topAlphas.map((strategy, index) => {
            const gemstone = strategy.sectors[0] ? getGemstoneForSector(strategy.sectors[0]) : 'Quartz';
            
            return (
              <Card 
                key={strategy.id} 
                className="glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300"
              >
                <CardContent className="p-6">
                  {/* Rank badge and thumbnail */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                          index === 1 ? 'bg-gray-400/20 text-gray-300' : 
                          'bg-amber-700/20 text-amber-600'}
                      `}>
                        #{index + 1}
                      </div>
                      <PortfolioThumbnail
                        sectors={strategy.sectors}
                        geoFocus={strategy.geo_focus}
                        riskLevel={strategy.risk_level}
                        gemstone={gemstone}
                        size="sm"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {strategy.strategy_type}
                    </span>
                  </div>

                  {/* Alpha & Portfolio */}
                  <Link 
                    to={`/strategy/${strategy.id}`}
                    className="block group-hover:text-primary transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-1">{strategy.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{strategy.creator_id}</p>
                  </Link>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                        <Users className="h-3 w-3" />
                        Investors
                      </div>
                      <p className="font-semibold">{strategy.followers_count.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                        <TrendingUp className="h-3 w-3" />
                        Allocated
                      </div>
                      <p className="font-semibold">{formatCurrency(strategy.allocated_amount_usd)}</p>
                    </div>
                  </div>

                  {/* Monthly Earnings - Highlighted */}
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Monthly Earnings</p>
                        <p className="text-xl font-bold text-primary">
                          ${strategy.creator_est_monthly_earnings_usd.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="glow-primary">
            <Link to="/onboarding">
              Become an Alpha
              <TrendingUp className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
