import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LineChart, Users, TrendingUp, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { mockPortfolios, formatCurrency } from '@/lib/mockData';

export default function Landing() {
  const totalAllocated = mockPortfolios.reduce((acc, p) => acc + p.allocated_amount, 0);
  const totalFollowers = mockPortfolios.reduce((acc, p) => acc + p.followers_count, 0);

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
              Create and test investing strategies{' '}
              <span className="gradient-text">before committing real capital</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in">
              Build portfolios manually or with GenAI, simulate performance in real market conditions, 
              and publish strategies others can follow.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Button asChild size="lg" className="glow-primary text-lg px-8 h-14">
                <Link to="/onboarding">
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

      {/* Stats Section */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text">{mockPortfolios.length}+</p>
              <p className="text-muted-foreground mt-1">Portfolios Created</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text">{formatCurrency(totalAllocated)}</p>
              <p className="text-muted-foreground mt-1">Mock Allocated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text">{totalFollowers.toLocaleString()}</p>
              <p className="text-muted-foreground mt-1">Total Followers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text">78%</p>
              <p className="text-muted-foreground mt-1">Avg Consistency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to invest smarter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From AI-assisted portfolio creation to risk simulation, we've got you covered.
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
                See risk and drawdowns before you invest. Test your strategy against 
                historical data and understand potential outcomes.
              </p>
            </div>

            {/* Creator Marketplace */}
            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Creator Marketplace</h3>
              <p className="text-muted-foreground">
                Publish strategies, earn when others allocate. Build your reputation 
                and generate passive income from your investing expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
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
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-3xl blur-2xl" />
              <div className="relative glass-card rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Harborline Growth</h3>
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">Simulated</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">30d Return</p>
                    <p className="text-xl font-bold text-success">+4.2%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className="text-xl font-bold text-destructive">-8.5%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">1,247 followers</span>
                  <span className="text-muted-foreground">$1.8M allocated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to build your first strategy?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of investors using simulation to make smarter decisions.
            </p>
            <Button asChild size="lg" className="glow-primary text-lg px-8 h-14">
              <Link to="/onboarding">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}