import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, DollarSign, Users, TrendingUp, CheckCircle2, XCircle, ArrowRight, Star, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Mock: whether the current user meets Alpha requirements
const userRequirements = {
  hasLivePortfolio: false,
  personalInvestment: 0,
  portfolioAgeDays: 0,
};

const ALPHA_FEE_RATE = 0.0025; // 0.25% annually

const mockTestimonials = [
  {
    name: 'Ruby-891',
    creatorId: '@momentum_pro',
    gemstone: 'Ruby',
    sectors: ['Momentum', 'Technology', 'Innovation'],
    followers: 756,
    aum: 4200000,
    monthlyEarnings: 875,
    quote: 'My high-conviction momentum portfolio speaks for itself. The earnings follow the performance.',
    riskLevel: 'High' as const,
    reputationScore: 4.6,
  },
  {
    name: 'Pearl-142',
    creatorId: '@alpha_99',
    gemstone: 'Pearl',
    sectors: ['Bonds', 'Broad Market', 'International'],
    followers: 2389,
    aum: 2450000,
    monthlyEarnings: 510,
    quote: 'The platform made it easy to validate my balanced thesis and attract followers with steady returns.',
    riskLevel: 'Low' as const,
    reputationScore: 4.9,
  },
  {
    name: 'Sapphire-347',
    creatorId: '@inv_7x2k',
    gemstone: 'Sapphire',
    sectors: ['Broad Market', 'Technology', 'International'],
    followers: 1247,
    aum: 1850000,
    monthlyEarnings: 385,
    quote: 'I built a tech-focused portfolio and now earn passive income while it runs on autopilot.',
    riskLevel: 'Medium' as const,
    reputationScore: 4.8,
  },
];
const gemstoneColorMap: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  Sapphire: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: Crown },
  Pearl: { bg: 'bg-slate-300/10', text: 'text-slate-300', border: 'border-slate-300/30', icon: Crown },
  Ruby: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', icon: Crown },
};

export default function Alpha() {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([50]);
  const [avgAllocation, setAvgAllocation] = useState([10000]);

  const totalAUM = followers[0] * avgAllocation[0];
  const annualEarnings = totalAUM * ALPHA_FEE_RATE;
  const monthlyEarnings = annualEarnings / 12;

  const meetsAll =
    userRequirements.hasLivePortfolio &&
    userRequirements.personalInvestment >= 1000 &&
    userRequirements.portfolioAgeDays >= 30;

  const requirements = [
    {
      label: 'Live portfolio exists',
      met: userRequirements.hasLivePortfolio,
      description: 'You need at least one portfolio that has passed simulation and gone live.',
    },
    {
      label: 'Minimum $1,000 personal investment',
      met: userRequirements.personalInvestment >= 1000,
      description: 'You must have at least $1,000 of your own capital invested — skin in the game.',
    },
    {
      label: 'Portfolio live for at least 30 days',
      met: userRequirements.portfolioAgeDays >= 30,
      description: 'Your portfolio needs a 30-day live track record before it can be published.',
    },
    {
      label: 'Max drawdown under 20%',
      met: false,
      description: 'Your portfolio must maintain a maximum drawdown under 20% during the validation period.',
    },
    {
      label: 'Minimum 5 holdings',
      met: false,
      description: 'Your portfolio must contain at least 5 different holdings for adequate diversification.',
    },
    {
      label: 'Risk disclosure acknowledged',
      met: false,
      description: 'You must acknowledge that followers rely on your portfolio decisions and accept the responsibility.',
    },
    {
      label: 'Email verified',
      met: true,
      description: 'Your email address must be verified before publishing to the marketplace.',
    },
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Crown className="h-4 w-4" />
              Become an Alpha
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in leading-tight">
              Turn your investing expertise into{' '}
              <span className="gradient-text">passive income</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto animate-fade-in">
              Build a portfolio, prove it in simulation, then publish it to the marketplace.
              When followers allocate to your portfolio, you earn{' '}
              <span className="font-semibold text-primary">0.25% of their AUM annually</span>, paid monthly.
            </p>

            <p className="text-muted-foreground mb-10 animate-fade-in">
              The platform charges a separate 0.25% — simple, transparent, and aligned.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Button asChild size="lg" className="glow-primary text-lg px-8 h-14">
                <Link to="/invest">
                  Create Your Portfolio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14">
                <a href="#calculator">
                  <DollarSign className="mr-2 h-5 w-5" />
                  See Your Earnings Potential
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: BarChart3, title: '1. Build & Simulate', description: 'Use our AI advisor or build manually. Run a free simulation to prove your portfolio works.' },
            { icon: Shield, title: '2. Invest & Validate', description: 'Put your own capital in — at least $1,000. After 30 days live, you can publish to the marketplace.' },
            { icon: DollarSign, title: '3. Earn Passively', description: 'When followers allocate to your portfolio, you earn 0.25% of their AUM annually, paid monthly.' },
          ].map((step) => (
            <Card key={step.title} className="glass-card text-center">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Earnings Calculator */}
      <section id="calculator" className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Earnings Calculator</h2>
          <p className="text-center text-muted-foreground mb-10">
            See how much you could earn as an Alpha based on your follower count and their average investment.
          </p>

          <Card className="glass-card">
            <CardContent className="p-8 space-y-8">
              {/* Followers slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/40">Number of Followers</span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-[250px]">Estimated number of followers for your portfolio</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-2xl font-bold text-primary">{followers[0]}</span>
                </div>
                <Slider
                  value={followers}
                  onValueChange={setFollowers}
                  min={1}
                  max={500}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>1</span>
                  <span>500</span>
                </div>
              </div>

              {/* Avg Allocation slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/40">Avg. Allocation per Follower</span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-[250px]">Average capital each follower allocates to your portfolio</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <span className="text-2xl font-bold text-primary">
                    ${avgAllocation[0].toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={avgAllocation}
                  onValueChange={setAvgAllocation}
                  min={1000}
                  max={100000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>$1K</span>
                  <span>$100K</span>
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total AUM</p>
                  <p className="font-mono tabular-nums" style={{ fontSize: '2rem', fontWeight: 700 }}>${totalAUM.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Earnings</p>
                  <p className="font-mono tabular-nums text-success earnings-glow" style={{ fontSize: '2rem', fontWeight: 700 }}>${Math.round(monthlyEarnings).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Annual Earnings</p>
                  <p className="font-mono tabular-nums text-success earnings-glow" style={{ fontSize: '2rem', fontWeight: 700 }}>${Math.round(annualEarnings).toLocaleString()}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Based on 0.25% annual Alpha share of follower AUM. Actual earnings depend on allocation and retention.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Publishing Requirements */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Publishing Requirements</h2>
          <p className="text-center text-muted-foreground mb-10">
            To publish your portfolio to the marketplace, you must meet all of the following criteria.
          </p>

          <Card className="glass-card">
            <CardContent className="p-8 space-y-6">
              {requirements.map((req) => (
                <div key={req.label} className="flex items-start gap-4">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                    req.met ? "bg-success/10" : "bg-muted"
                  )}>
                    {req.met ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      req.met ? "text-success" : "text-foreground"
                    )}>
                      {req.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{req.description}</p>
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-border">
                {meetsAll ? (
                  <Button
                    size="lg"
                    className="w-full glow-primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Publish Your Portfolio
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-muted-foreground text-sm">
                      You haven't met all requirements yet. Start by creating and funding a portfolio.
                    </p>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/invest">
                        Start Building Your Portfolio
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alpha Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">Top Alphas on the Platform</h2>
        <p className="text-center text-muted-foreground mb-10">
          Real portfolios, real earnings, real skin in the game.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {mockTestimonials.map((alpha) => {
            const colors = gemstoneColorMap[alpha.gemstone] || gemstoneColorMap.Sapphire;
            const GemIcon = colors.icon;
            return (
              <Card key={alpha.name} className="glass-card">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border",
                      colors.bg, colors.border
                    )}>
                      <GemIcon className={cn("h-6 w-6", colors.text)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{alpha.name}</h3>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-xs">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-primary">{alpha.reputationScore}</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{alpha.creatorId}</p>
                    </div>
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-muted-foreground italic mb-5">"{alpha.quote}"</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Followers</p>
                      <p className="font-semibold">{alpha.followers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Total AUM</p>
                      <p className="font-semibold">${(alpha.aum / 1_000_000).toFixed(1)}M</p>
                    </div>
                  </div>

                  {/* Earnings highlight */}
                  <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Earnings</p>
                        <p className="text-lg font-bold text-primary">${alpha.monthlyEarnings.toLocaleString()}/mo</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </PageLayout>
  );
}
