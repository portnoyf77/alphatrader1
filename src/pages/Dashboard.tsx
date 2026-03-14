import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Shield, BarChart3, Wallet, ExternalLink, Tag, Briefcase, Handshake, FlaskConical, ChevronRight, ArrowUp, ArrowDown, Plus, Sparkles, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageLayout } from '@/components/layout/PageLayout';
import { GemDot } from '@/components/GemDot';
import { formatCurrency, formatPercent, mockPortfolios } from '@/lib/mockData';
import { cn, riskDisplayLabel } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { useMockAuth } from '@/contexts/MockAuthContext';

function getUserCreatedPortfolios(): any[] {
  try { return JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]'); } catch { return []; }
}

// My portfolios (ones I created) — merge mock + user-created
const baseMy = mockPortfolios.slice(0, 4);
// Portfolios I've invested in
const investedPortfolioData: Record<string, { myAllocation: number; myReturn: number }> = {
  '5': { myAllocation: 38000, myReturn: -4.8 },
  '6': { myAllocation: 33000, myReturn: 0.0 },
  '7': { myAllocation: 33000, myReturn: 5.0 },
};
const investedPortfolios = mockPortfolios.slice(4, 7).map(p => ({
  ...p,
  myAllocation: investedPortfolioData[p.id]?.myAllocation ?? 25000,
  myReturn: investedPortfolioData[p.id]?.myReturn ?? 0,
}));

// Mock user total return vs S&P 500
const userTotalReturn = 12.4;
const sp500Return = 9.8;
const vsSP500 = userTotalReturn - sp500Return;

// Helper to get gem color for left border
function getGemBorderColor(name: string): string {
  if (name.startsWith('Sapphire')) return '#3B82F6';
  if (name.startsWith('Ruby')) return '#E11D48';
  if (name.startsWith('Pearl')) return '#E2E8F0';
  return 'rgba(255,255,255,0.1)';
}

// Mock news with thumbnail gradients per sector
const sectorGradients: Record<string, string> = {
  Financials: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f3a 100%)',
  Technology: 'linear-gradient(135deg, #3b1f6e 0%, #1a0e3a 100%)',
  'Clean Energy': 'linear-gradient(135deg, #0f4a2e 0%, #0a2618 100%)',
  Healthcare: 'linear-gradient(135deg, #134e5e 0%, #0a2a30 100%)',
  Industrial: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
  Bonds: 'linear-gradient(135deg, #1a3a5f 0%, #0d1f33 100%)',
  Energy: 'linear-gradient(135deg, #3d2b0f 0%, #1f1508 100%)',
  Growth: 'linear-gradient(135deg, #1f3d1f 0%, #0f1f0f 100%)',
  Policy: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
};

const mockNews = [
  { headline: 'Fed Signals Potential Rate Pause in Q3', url: 'https://reuters.com', sector: 'Financials', tag: 'Relevant to your Financials holdings', source: 'Reuters', date: 'Mar 13, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=134&fit=crop' },
  { headline: 'NVIDIA Reports Record Data Center Revenue', url: 'https://bloomberg.com', sector: 'Technology', tag: 'Relevant to your Tech holdings', source: 'Bloomberg', date: 'Mar 13, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=134&fit=crop' },
  { headline: 'Treasury Yields Drop as Inflation Cools', url: 'https://reuters.com', sector: 'Bonds', tag: 'Relevant to your Bond holdings', source: 'Reuters', date: 'Mar 13, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&h=134&fit=crop' },
  { headline: 'Apple Announces $100B Buyback Program', url: 'https://bloomberg.com', sector: 'Technology', tag: 'Relevant to your Tech holdings', source: 'Bloomberg', date: 'Mar 13, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=200&h=134&fit=crop' },
  { headline: 'Renewable Energy Stocks Surge on Policy Update', url: 'https://reuters.com', sector: 'Clean Energy', tag: 'Relevant to your Clean Energy holdings', source: 'CNBC', date: 'Mar 12, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=134&fit=crop' },
  { headline: 'Oil Prices Steady Amid OPEC Output Talks', url: 'https://cnbc.com', sector: 'Energy', tag: 'Market-wide impact', source: 'CNBC', date: 'Mar 12, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=200&h=134&fit=crop' },
  { headline: 'Small-Cap Stocks Outperform in Q1', url: 'https://wsj.com', sector: 'Growth', tag: 'Relevant to your Growth holdings', source: 'WSJ', date: 'Mar 12, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&h=134&fit=crop' },
  { headline: 'Healthcare M&A Activity Hits 2025 High', url: 'https://reuters.com', sector: 'Healthcare', tag: 'Relevant to your Healthcare holdings', source: 'Reuters', date: 'Mar 11, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=134&fit=crop' },
  { headline: 'EU Carbon Tax Takes Effect Next Month', url: 'https://ft.com', sector: 'Policy', tag: 'Relevant to your Clean Energy holdings', source: 'Financial Times', date: 'Mar 11, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=200&h=134&fit=crop' },
  { headline: 'Global Supply Chain Bottlenecks Easing', url: 'https://reuters.com', sector: 'Industrial', tag: 'Market-wide impact', source: 'Reuters', date: 'Mar 11, 2026', thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=134&fit=crop' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useMockAuth();
  const [activeTab, setActiveTab] = useState<'my-portfolios' | 'invested' | 'simulating'>('my-portfolios');
  const [dismissedPublishPrompt, setDismissedPublishPrompt] = useState(false);

  // Merge mock + user-created portfolios
  const userCreated = useMemo(() => getUserCreatedPortfolios(), []);
  const myPortfolios = useMemo(() => {
    const normalized = userCreated.map((p: any) => ({
      ...p,
      performance: p.performance || { return_30d: 0, max_drawdown: 0, consistency_score: 50 },
      creator_investment: p.creator_investment || 0,
      risk_level: p.risk_level || 'Medium',
    }));
    return [...baseMy, ...normalized];
  }, [userCreated]);

  const simulatingPortfolios = useMemo(() =>
    myPortfolios.filter((p: any) => p.status === 'private' || p.status === 'simulating'), [myPortfolios]);

  const livePortfolios = myPortfolios.filter((s: any) => s.status !== 'private' && s.status !== 'simulating');
  const liveCount = livePortfolios.length;
  const simulatingCount = simulatingPortfolios.length;
  const totalMyInvestment = myPortfolios.reduce((acc: number, s: any) => acc + (s.creator_investment || 0), 0);
  const totalInvestedInOthers = investedPortfolios.reduce((acc, s) => acc + s.myAllocation, 0);
  const totalValue = totalMyInvestment + totalInvestedInOthers;
  const totalAllocatedInvested = investedPortfolios.reduce((acc, s) => acc + s.myAllocation, 0);

  // Count-up animations
  const animMyInvestment = useCountUp(totalMyInvestment, 800);
  const animTotalValue = useCountUp(totalValue, 800);
  const animVsSP500 = useCountUp(vsSP500, 800, 1);

  const tabCards = [
    {
      key: 'my-portfolios' as const,
      icon: Briefcase,
      label: 'My Portfolios',
      count: liveCount,
      detail: `${liveCount} live`,
    },
    {
      key: 'invested' as const,
      icon: Handshake,
      label: 'Invested In',
      count: investedPortfolios.length,
      detail: `${formatCurrency(totalAllocatedInvested)} allocated`,
    },
    {
      key: 'simulating' as const,
      icon: FlaskConical,
      label: 'Simulating',
      count: simulatingCount,
      detail: `${simulatingCount} active`,
    },
  ];

  const hasPortfolios = myPortfolios.length > 0;

  // Check if any live portfolio qualifies for marketplace publishing
  const qualifyingPortfolio = useMemo(() => {
    if (dismissedPublishPrompt) return null;

    return livePortfolios.find((p: any) => {
      // Only show promotion if the authenticated user is the portfolio's creator
      const isCreator = p.creator_id === `@${user?.username?.replace('@', '')}` || p.creator_id === user?.username;
      if (!isCreator) return false;
      // Don't show if already published
      if (p.isPublic === true) return false;

      const created = new Date(p.created_date);
      const daysSinceCreation = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      const drawdown = Math.abs(p.performance?.max_drawdown ?? 0);
      const holdingsCount = p.holdings?.length ?? 0;
      return daysSinceCreation >= 30 && drawdown < 20 && holdingsCount >= 5;
    });
  }, [livePortfolios, dismissedPublishPrompt, user]);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your portfolios and investments.</p>
        </div>

        {/* Hero Summary Bar */}
        <div data-tour="summary-stats" className="flex items-start justify-between gap-6 mb-10 flex-wrap">
          <div className="flex items-start gap-10 flex-wrap">
            {/* Invested */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[2rem] font-bold text-foreground">{formatCurrency(animMyInvestment)}</span>
                <span className="text-[0.9rem] text-muted-foreground">invested</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3" style={{ color: '#10B981' }} />
                <span className="text-[0.8rem] font-medium" style={{ color: '#10B981' }}>+3.2%</span>
                <span className="text-[0.8rem] text-muted-foreground">this month</span>
              </div>
            </div>
            {/* Total Value */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[2rem] font-bold text-foreground">{formatCurrency(animTotalValue)}</span>
                <span className="text-[0.9rem] text-muted-foreground">total value</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3" style={{ color: '#10B981' }} />
                <span className="text-[0.8rem] font-medium" style={{ color: '#10B981' }}>+8.1%</span>
                <span className="text-[0.8rem] text-muted-foreground">this month</span>
              </div>
            </div>
            {/* vs S&P 500 */}
            <div className="flex flex-col">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-baseline gap-2 cursor-help">
                      <span className={cn(
                        "font-mono text-[2rem] font-bold",
                        vsSP500 >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {vsSP500 >= 0 ? '+' : ''}{animVsSP500}%
                      </span>
                      <span className="text-[0.9rem] text-muted-foreground">vs S&P 500</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    You: {formatPercent(userTotalReturn)} · S&P: {formatPercent(sp500Return)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[0.8rem] text-muted-foreground">You: +{userTotalReturn}% · S&P: +{sp500Return}%</span>
              </div>
            </div>
          </div>

          {/* Create New Portfolio Button */}
          <Link to="/invest">
            <Button className="h-10 gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Create New Portfolio
            </Button>
          </Link>
        </div>

        {/* Contextual Alpha Promotion */}
        {qualifyingPortfolio && (
          <div
            className="mb-6 rounded-xl p-4 flex items-center gap-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: '3px solid hsl(var(--primary))',
            }}
          >
            <Crown className="h-5 w-5 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                Your portfolio <span className="font-semibold">{qualifyingPortfolio.name}</span> qualifies for the marketplace. Publish it and start earning when others follow.
              </p>
            </div>
            <Link to="/alpha">
              <Button variant="outline" size="sm" className="whitespace-nowrap text-xs">
                Learn How →
              </Button>
            </Link>
            <button
              onClick={() => setDismissedPublishPrompt(true)}
              className="p-1 rounded hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tab Cards */}
        <div data-tour="tab-cards" className="grid grid-cols-3 gap-4 mb-6">
          {tabCards.map(({ key, icon: Icon, label, count, detail }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer",
                "backdrop-blur-xl",
                activeTab === key
                  ? "border-2 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                  : "border hover:border-[rgba(255,255,255,0.12)]"
              )}
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: activeTab === key ? '#7C3AED' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4" style={{ color: activeTab === key ? '#A78BFA' : 'rgba(255,255,255,0.4)' }} />
                <span className={cn(
                  "text-sm font-medium",
                  activeTab === key ? "text-foreground" : "text-muted-foreground"
                )}>{label}</span>
              </div>
              <div className="font-mono text-[1.75rem] font-bold text-foreground mb-1">{count}</div>
              <div className="text-[0.85rem] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{detail}</div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'my-portfolios' && (
          livePortfolios.length === 0 ? (
            <div className="rounded-2xl border border-border/30 py-16 px-8 text-center mb-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Sparkles className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">You haven't created any portfolios yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Let the AI build one for you in minutes. Answer a few questions and get a personalized portfolio.
              </p>
              <Link to="/invest">
                <Button className="gap-2">
                  Create Your First Portfolio
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <Card className="glass-card mb-8">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-muted-foreground/40">Status</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Current portfolio status: Live, Simulating, or Inactive</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-muted-foreground/40">My Investment</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Capital you've invested in this portfolio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-muted-foreground/40">30d Return</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Portfolio return over the last 30 days</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {livePortfolios.map((portfolio) => (
                      <TableRow
                        key={portfolio.id}
                        className="cursor-pointer hover:bg-secondary/50 transition-all"
                        style={{ borderLeft: '3px solid transparent' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = getGemBorderColor(portfolio.name); }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}
                        onClick={() => navigate(`/dashboard/portfolio/${portfolio.id}`)}
                      >
                        <TableCell>
                          <Link to={`/dashboard/portfolio/${portfolio.id}`} className="font-medium hover:text-primary transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <GemDot name={portfolio.name} />
                            {portfolio.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className={cn("px-2 py-1 rounded text-xs", portfolio.status === 'validated_listed' ? "bg-success/20 text-success" : portfolio.status === 'inactive' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning")}>
                            {portfolio.status === 'validated_listed' ? 'Live' : portfolio.status === 'inactive' ? 'Inactive' : 'Simulating'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(portfolio.creator_investment)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("flex items-center justify-end gap-1", portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                            {portfolio.performance.return_30d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(portfolio.performance.return_30d)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        )}

        {activeTab === 'invested' && (
          <Card className="glass-card mb-8">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Portfolio</TableHead>
                    <TableHead>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Creator</span></TooltipTrigger>
                          <TooltipContent className="text-xs max-w-[250px]">The Alpha who manages this portfolio</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">30d Return</span></TooltipTrigger>
                          <TooltipContent className="text-xs max-w-[250px]">Portfolio return over the last 30 days</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">My Allocation</span></TooltipTrigger>
                          <TooltipContent className="text-xs max-w-[250px]">Capital you've allocated to this portfolio</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">My Return</span></TooltipTrigger>
                          <TooltipContent className="text-xs max-w-[250px]">Your return since you started following this portfolio</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investedPortfolios.map((portfolio) => (
                    <TableRow
                      key={portfolio.id}
                      className="cursor-pointer hover:bg-secondary/50 transition-all"
                      style={{ borderLeft: '3px solid transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = getGemBorderColor(portfolio.name); }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}
                    >
                      <TableCell>
                        <Link to={`/portfolio/${portfolio.id}`} state={{ from: 'dashboard' }} className="font-medium hover:text-primary transition-colors flex items-center gap-2">
                          <GemDot name={portfolio.name} />
                          {portfolio.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{portfolio.creator_id}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("flex items-center justify-end gap-1", (portfolio.performance?.return_30d ?? 0) >= 0 ? "text-success" : "text-destructive")}>
                          {(portfolio.performance?.return_30d ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatPercent(portfolio.performance?.return_30d ?? 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(portfolio.myAllocation)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("flex items-center justify-end gap-1", portfolio.myReturn >= 0 ? "text-success" : "text-destructive")}>
                          {portfolio.myReturn >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatPercent(portfolio.myReturn)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'simulating' && (
          <Card className="glass-card mb-8">
            <CardContent className="p-0">
              {simulatingPortfolios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No portfolios currently simulating.</p>
                  <Link to="/invest" className="text-primary hover:underline text-sm">Create a new portfolio →</Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Sim. Duration</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Number of days this simulation has been running</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Sim. Return</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Simulated return since simulation started</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Worst Drop</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Largest peak-to-trough decline during simulation</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Risk Level</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Portfolio risk classification: Conservative, Moderate, or Aggressive</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulatingPortfolios.map((portfolio) => (
                      <TableRow
                        key={portfolio.id}
                        className="cursor-pointer hover:bg-secondary/50 transition-all"
                        style={{ borderLeft: '3px solid transparent' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = getGemBorderColor(portfolio.name); }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}
                        onClick={() => navigate(`/simulation/${portfolio.id}`)}
                      >
                        <TableCell>
                          <Link to={`/simulation/${portfolio.id}`} className="font-medium hover:text-primary transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <GemDot name={portfolio.name} />
                            {portfolio.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">19 days</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("flex items-center justify-end gap-1", portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                            {portfolio.performance.return_30d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(portfolio.performance.return_30d)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const dd = Math.abs(portfolio.performance.max_drawdown);
                            const color = dd >= 20 ? '#EF4444' : dd >= 18 ? '#F97316' : dd >= 15 ? '#F59E0B' : undefined;
                            return <span style={color ? { color } : undefined}>{formatPercent(portfolio.performance.max_drawdown, false)}</span>;
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("px-2 py-1 rounded text-xs",
                            portfolio.risk_level === 'Low' ? "bg-success/20 text-success" :
                            portfolio.risk_level === 'Medium' ? "bg-warning/20 text-warning" :
                            "bg-destructive/20 text-destructive"
                          )}>
                            {riskDisplayLabel(portfolio.risk_level)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right w-8">
                          <ChevronRight size={16} className="text-muted-foreground/30" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Market News — horizontal carousel */}
        <div data-tour="market-news" className="mb-8">
          <h2 className="text-lg font-bold mb-4">Market News</h2>
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <style>{`
              .news-carousel::-webkit-scrollbar { height: 4px; }
              .news-carousel::-webkit-scrollbar-track { background: transparent; }
              .news-carousel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            `}</style>
            {mockNews.map((news, i) => (
              <a
                key={i}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-carousel group flex-shrink-0 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{
                  minWidth: '220px',
                  maxWidth: '220px',
                  scrollSnapAlign: 'start',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Thumbnail */}
                <div
                  className="w-full h-[120px] overflow-hidden"
                  style={{
                    borderRadius: '12px 12px 0 0',
                    background: sectorGradients[news.sector] || sectorGradients.Industrial,
                  }}
                >
                  <img
                    src={news.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                {/* Text content */}
                <div className="p-3 flex flex-col gap-2">
                  <p
                    className="text-[0.85rem] font-semibold text-foreground leading-snug group-hover:text-white transition-colors"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {news.headline}
                  </p>
                  {/* Relevance tag chip */}
                  <span
                    className="text-[0.75rem] truncate inline-block w-fit max-w-full"
                    style={{
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#A78BFA',
                    }}
                  >
                    {news.tag}
                  </span>
                  {/* Source & Date */}
                  <div className="flex items-center gap-1 text-[0.7rem]">
                    <span className="font-semibold text-foreground">{news.source}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{news.date}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
