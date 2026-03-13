import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LineChart, Users, TrendingUp, Zap, Shield, DollarSign, HelpCircle, Crown, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { AlphaSpotlight } from '@/components/AlphaSpotlight';
import { HowAlphasEarn } from '@/components/HowAlphasEarn';
import { AlphaEarningsCalculator } from '@/components/AlphaEarningsCalculator';
import { mockPortfolios, formatCurrency, creatorStats } from '@/lib/mockData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Landing() {
  const validatedPortfolios = mockPortfolios.filter(s => s.status === 'validated_listed');
  const totalAllocated = validatedPortfolios.reduce((acc, s) => acc + s.allocated_amount_usd, 0);
  const totalFollowers = validatedPortfolios.reduce((acc, s) => acc + s.followers_count, 0);
  
  return (
    <PageLayout showDisclaimer={true}>
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-ambient">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              AI-Powered Portfolio Builder
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in leading-tight tracking-tight">
              Build, simulate, and{' '}
              <span className="gradient-text">earn from your portfolios</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in">
              Create portfolios with GenAI, prove them in simulation, then publish and earn 
              when others allocate. Turn your investing expertise into passive income.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Button asChild size="lg" className="glow-primary text-lg px-8 h-14">
                <Link to="/signup">
                  Get Started
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

      {/* Free Trial Banner */}
      <section className="py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center p-6 rounded-2xl bg-success/5 border border-success/20">
            <h3 className="text-xl font-bold mb-2">Try Alpha Trader free for 7 days</h3>
            <p className="text-muted-foreground mb-4">No credit card required.</p>
            <Button asChild size="lg" className="glow-primary">
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <TooltipProvider delayDuration={200}>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-4 md:gap-16 max-w-3xl">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help relative">
                      <p className="font-bold gradient-text font-mono tabular-nums text-xl sm:text-2xl md:text-[2rem]" style={{ fontWeight: 700 }}>{formatCurrency(totalAllocated)}</p>
                      <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Capital Allocated</p>
                      <div className="absolute bottom-[-4px] left-[20%] w-[60%] h-[2px] opacity-50" style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px]">
                    Total capital allocated by investors across all portfolios on the platform
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help relative">
                      <p className="font-bold gradient-text font-mono tabular-nums text-xl sm:text-2xl md:text-[2rem]" style={{ fontWeight: 700 }}>{totalFollowers.toLocaleString()}</p>
                      <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Active Followers</p>
                      <div className="absolute bottom-[-4px] left-[20%] w-[60%] h-[2px] opacity-50" style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px]">
                    Number of unique followers currently allocating to portfolios
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help relative">
                      <p className="font-bold text-primary font-mono tabular-nums text-xl sm:text-2xl md:text-[2rem]" style={{ fontWeight: 700 }}>${creatorStats.totalAlphaEarnings.toLocaleString()}</p>
                      <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-xs sm:text-sm">
                        Alpha Earnings
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <div className="absolute bottom-[-4px] left-[20%] w-[60%] h-[2px] opacity-50" style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[250px]">
                    <strong>Alphas</strong> are portfolio managers who share their investment portfolios. 
                    When investors allocate capital to an Alpha's portfolio, the Alpha earns a share of the platform fees.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Connecting line behind steps */}
            <div className="hidden md:block absolute top-[3.5rem] left-[16.7%] right-[16.7%] h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
            
            {[
              { num: '1', icon: MessageSquare, title: 'Tell the AI your goals', desc: 'Answer a few questions and get a personalized portfolio in minutes.' },
              { num: '2', icon: BarChart3, title: 'Simulate with live data', desc: 'Test your portfolio with real market data before committing capital.' },
              { num: '3', icon: DollarSign, title: 'Invest or earn as an Alpha', desc: 'Go live with your portfolio, or publish it to the marketplace and earn when others follow.' },
            ].map((step) => (
              <div key={step.num} className="text-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group relative">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {step.num}
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
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
              An <span className="text-primary font-medium">Alpha</span> is a portfolio manager who designs investment portfolios 
              and makes them available for others to replicate. When investors allocate capital to follow an Alpha's portfolio, 
              the Alpha earns passive income from management fees — turning expertise into earnings.
            </p>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Invest smarter — or earn from your expertise
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're looking to follow proven portfolios or share your own, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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

            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LineChart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Simulation First</h3>
              <p className="text-muted-foreground">
                 Test your portfolio with live market data in real time before committing real capital.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden">
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
      <AlphaSpotlight strategies={validatedPortfolios} />

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
                      Earn 0.25% of follower AUM annually when followers allocate to your published portfolios.
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
            <div className="text-center p-8 rounded-2xl bg-card relative overflow-hidden" style={{ border: '1px solid transparent', backgroundClip: 'padding-box' }}>
              <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(124, 58, 237, 0.3))', margin: '-1px', borderRadius: '16px', zIndex: -1 }} />
              <h3 className="text-2xl font-bold mb-3">Ready to invest smarter?</h3>
              <p className="text-muted-foreground mb-6">
                Explore proven portfolios from top Alphas.
              </p>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link to="/explore">
                  Explore Portfolios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Alpha CTA */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30" style={{ boxShadow: '0 0 40px rgba(124, 58, 237, 0.1)' }}>
              <h3 className="text-2xl font-bold mb-3">Ready to earn from your expertise?</h3>
              <p className="text-muted-foreground mb-6">
                Build and publish your first portfolio today.
              </p>
              <Button asChild size="lg" className="w-full glow-primary">
                <Link to="/signup">
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
