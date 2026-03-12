import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LineChart, Users, TrendingUp, Zap, Shield, DollarSign, HelpCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { AlphaSpotlight } from '@/components/AlphaSpotlight';
import { HowAlphasEarn } from '@/components/HowAlphasEarn';
import { AlphaEarningsCalculator } from '@/components/AlphaEarningsCalculator';
import { mockStrategies, formatCurrency, creatorStats } from '@/lib/mockData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Landing() {
  const validatedStrategies = mockStrategies.filter(s => s.status === 'validated_listed');
  const totalAllocated = validatedStrategies.reduce((acc, s) => acc + s.allocated_amount_usd, 0);
  const totalFollowers = validatedStrategies.reduce((acc, s) => acc + s.followers_count, 0);
  
  return (
    <PageLayout showDisclaimer={false}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              AI-Powered Portfolio Builder
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in leading-tight">
              Build, simulate, and{' '}
              <span className="gradient-text">earn from your strategies</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in">
              Create portfolios with GenAI, prove them in simulation, then publish and earn 
              when others allocate. Turn your investing expertise into passive income.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Button asChild size="lg" className="glow-primary text-lg px-8 h-14">
                <Link to="/invest">
                  Start Investing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14">
                <Link to="/explore">
                  Explore Portfolios
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced with Alpha earnings */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <TooltipProvider delayDuration={200}>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-3xl">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <p className="text-3xl md:text-4xl font-bold gradient-text">{formatCurrency(totalAllocated)}</p>
                      <p className="text-muted-foreground mt-1">Capital Allocated</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px]">
                    Total capital allocated by investors across all portfolios on the platform
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <p className="text-3xl md:text-4xl font-bold gradient-text">{totalFollowers.toLocaleString()}</p>
                      <p className="text-muted-foreground mt-1">Active Followers</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px]">
                    Number of unique investors currently following portfolios
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <p className="text-3xl md:text-4xl font-bold text-primary">${creatorStats.totalAlphaEarnings.toLocaleString()}</p>
                      <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        Alpha Earnings
                        <HelpCircle className="h-3 w-3" />
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[250px]">
                    <strong>Alphas</strong> are portfolio managers who share their investment strategies. 
                    When investors allocate capital to an Alpha's portfolio, the Alpha earns a share of the platform fees.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </section>

      {/* What is an Alpha? Explanation Banner */}
      <section className="py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              What is an Alpha?
            </h3>
            <p className="text-muted-foreground">
              An <span className="text-primary font-medium">Alpha</span> is a portfolio manager who designs investment strategies 
              and makes them available for others to replicate. When investors allocate capital to follow an Alpha's portfolio, 
              the Alpha earns passive income from management fees — turning expertise into earnings.
            </p>
          </div>
        </div>
      </section>

      {/* Value Props Section - Enhanced Alpha Marketplace */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Invest smarter — or earn from your expertise
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're looking to follow proven strategies or share your own, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* GenAI Portfolio Builder */}
            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">GenAI Portfolio Builder</h3>
              <p className="text-muted-foreground">
                Turn goals and constraints into a diversified portfolio in minutes. 
                Our AI analyzes thousands of assets to create optimal allocations.
              </p>
            </div>

            {/* Simulation First */}
            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LineChart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Simulation First</h3>
              <p className="text-muted-foreground">
                 Test your strategy with live market data in real time before committing real capital.
              </p>
            </div>

            {/* Alpha Marketplace - Enhanced */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  Earn 20%
                </span>
              </div>
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Alpha Marketplace</h3>
              <p className="text-muted-foreground mb-4">
                Publish your portfolios and earn when others allocate. 
                Build your reputation and generate passive income from your expertise.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">
                  Top Alpha earning ~${creatorStats.topCreatorEarnings.toLocaleString()}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alpha Spotlight Section */}
      <AlphaSpotlight strategies={validatedStrategies} />

      {/* How Alphas Earn Section */}
      <HowAlphasEarn />

      {/* Features Grid with Calculator */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for modern investors
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Real-time Simulations</h4>
                    <p className="text-muted-foreground">
                      See how your portfolio would have performed with actual market data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Risk-Adjusted Rankings</h4>
                    <p className="text-muted-foreground">
                      Leaderboards emphasize consistency and risk controls, not just returns.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Transparent Track Records</h4>
                    <p className="text-muted-foreground">
                      Every portfolio shows complete performance history with clear disclaimers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Alpha Revenue Share</h4>
                    <p className="text-muted-foreground">
                      Earn 20% of platform fees when investors allocate to your published portfolios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Earnings Calculator */}
            <AlphaEarningsCalculator />
          </div>
        </div>
      </section>

      {/* CTA Section - Dual path */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Investor CTA */}
            <div className="text-center p-8 rounded-2xl bg-card border border-border/50">
              <h3 className="text-2xl font-bold mb-3">Ready to invest smarter?</h3>
              <p className="text-muted-foreground mb-6">
                Explore proven strategies from top Alphas.
              </p>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link to="/explore">
                  Explore Portfolios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Alpha CTA */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30">
              <h3 className="text-2xl font-bold mb-3">Ready to earn from your expertise?</h3>
              <p className="text-muted-foreground mb-6">
                Build and publish your first portfolio today.
              </p>
              <Button asChild size="lg" className="w-full glow-primary">
                <Link to="/onboarding">
                  Become an Alpha
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
