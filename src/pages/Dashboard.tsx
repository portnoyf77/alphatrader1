import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Shield, Filter, Pause, BarChart3, Wallet, Settings, ExternalLink, Tag, AlertTriangle, Briefcase, Handshake, FlaskConical, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PageLayout } from '@/components/layout/PageLayout';
import { PendingUpdatesPanel } from '@/components/PendingUpdatesPanel';
import { GemDot } from '@/components/GemDot';
import { formatCurrency, formatPercent, mockPortfolios, getPortfoliosWithPendingUpdates } from '@/lib/mockData';
import { cn, riskDisplayLabel } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Area } from 'recharts';
import { useCountUp } from '@/hooks/useCountUp';

// My portfolios (ones I created)
const myPortfolios = mockStrategies.slice(0, 4);
// Portfolios I've invested in
const investedPortfolios = mockStrategies.slice(4, 7).map(p => ({
  ...p,
  myAllocation: Math.round(Math.random() * 50000) + 5000,
  myReturn: (Math.random() - 0.3) * 20,
}));
// Simulating portfolios
const simulatingPortfolios = myPortfolios.filter(p => p.status === 'private');

// Mock user total return vs S&P 500
const userTotalReturn = 12.4;
const sp500Return = 9.8;
const vsSP500 = userTotalReturn - sp500Return;

// Seeded random for deterministic chart data
function seededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Mock benchmark chart data (deterministic)
function generateBenchmarkData(days: number) {
  const random = seededRandom(days * 7 + 123);
  const data = [];
  let portfolio = 100000;
  let sp500 = 100000;
  let dow = 100000;
  const now = new Date('2025-01-15');
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    portfolio += portfolio * ((random() - 0.47) * 0.015);
    sp500 += sp500 * ((random() - 0.48) * 0.012);
    dow += dow * ((random() - 0.48) * 0.011);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'My Portfolio': Math.round(portfolio),
      'S&P 500': Math.round(sp500),
      'Dow Jones': Math.round(dow),
    });
  }
  return data;
}

const benchmarkDataSets: Record<string, ReturnType<typeof generateBenchmarkData>> = {
  '30D': generateBenchmarkData(30),
  '90D': generateBenchmarkData(90),
  'YTD': generateBenchmarkData(120),
  '1Y': generateBenchmarkData(365),
};

// Mock news with thumbnail gradients per sector
const sectorGradients: Record<string, string> = {
  Financials: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f3a 100%)',
  Technology: 'linear-gradient(135deg, #3b1f6e 0%, #1a0e3a 100%)',
  'Clean Energy': 'linear-gradient(135deg, #0f4a2e 0%, #0a2618 100%)',
  Healthcare: 'linear-gradient(135deg, #134e5e 0%, #0a2a30 100%)',
  Industrial: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
};

const mockNews = [
  { headline: 'Fed Signals Potential Rate Pause in Q3', url: 'https://reuters.com', sector: 'Financials', tag: 'Relevant to your Financials holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=134&fit=crop' },
  { headline: 'NVIDIA Reports Record Data Center Revenue', url: 'https://reuters.com', sector: 'Technology', tag: 'Relevant to your Tech holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=134&fit=crop' },
  { headline: 'Renewable Energy Stocks Surge on Policy Update', url: 'https://reuters.com', sector: 'Clean Energy', tag: 'Relevant to your Clean Energy holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=134&fit=crop' },
  { headline: 'Healthcare M&A Activity Hits 2025 High', url: 'https://reuters.com', sector: 'Healthcare', tag: 'Relevant to your Healthcare holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=134&fit=crop' },
  { headline: 'Global Supply Chain Bottlenecks Easing', url: 'https://reuters.com', sector: 'Industrial', tag: 'Market-wide impact', thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=134&fit=crop' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [showOnlyValidated, setShowOnlyValidated] = useState(false);
  const [rebalancingMode, setRebalancingMode] = useState<'auto' | 'manual'>(() => {
    const saved = localStorage.getItem('rebalancingMode');
    return saved === 'manual' ? 'manual' : 'auto';
  });
  const [rebalancingModalOpen, setRebalancingModalOpen] = useState(false);
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState('30D');

  const filteredMyPortfolios = showOnlyValidated 
    ? myPortfolios.filter(s => s.validation_status === 'validated' && s.validation_criteria_met && s.status === 'validated_listed')
    : myPortfolios.filter(s => s.status !== 'private');

  const validatedCount = myPortfolios.filter(s => s.status === 'validated_listed').length;
  const simulatingCount = myPortfolios.filter(s => s.status === 'private').length;
  const totalMyInvestment = myPortfolios.reduce((acc, s) => acc + s.creator_investment, 0);
  const totalInvestedInOthers = investedPortfolios.reduce((acc, s) => acc + s.myAllocation, 0);

  // Count-up animations for stat tiles
  const animPortfolioCount = useCountUp(myPortfolios.length, 800);
  const animInvestedCount = useCountUp(investedPortfolios.length, 800);
  const animMyInvestment = useCountUp(totalMyInvestment, 800);
  const animTotalValue = useCountUp(totalMyInvestment + totalInvestedInOthers, 800);
  const animVsSP500 = useCountUp(vsSP500, 800, 1);

  const strategiesWithPending = getStrategiesWithPendingUpdates();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your portfolios and investments.</p>
        </div>

        {/* Pending Updates Panel */}
        {strategiesWithPending.length > 0 && (
          <div className="mb-8 relative">
            <div className="absolute top-4 right-4 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setRebalancingModalOpen(true)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[250px]">Configure rebalancing mode: auto-apply or require approval</TooltipContent>
              </Tooltip>
            </div>
            <PendingUpdatesPanel strategies={strategiesWithPending} rebalancingMode={rebalancingMode} />
          </div>
        )}

        {/* Stats Overview — 5 tiles */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help accent-bar-purple relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">My Portfolios</p>
                    </div>
                    <p className="text-3xl font-bold">{animPortfolioCount}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="text-success">{validatedCount} live</span>
                      {simulatingCount > 0 && <span>• {simulatingCount} simulating</span>}
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[250px]">
                Number of portfolios you've created (live and simulating)
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help accent-bar-purple relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Invested in Others</p>
                    </div>
                    <p className="text-3xl font-bold">{animInvestedCount}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatCurrency(totalInvestedInOthers)} allocated</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[250px]">
                Number of Alpha portfolios you're following
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help accent-bar-green relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-success" />
                      <p className="text-sm text-muted-foreground">My Investment</p>
                    </div>
                    <p className="text-3xl font-bold text-success">{formatCurrency(animMyInvestment)}</p>
                    <p className="text-xs text-muted-foreground mt-2">In my own portfolios</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[250px]">
                Total capital invested in your own portfolios
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help accent-bar-amber relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Total Value</p>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(animTotalValue)}</p>
                    <p className="text-xs text-muted-foreground mt-2">All investments</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[250px]">
                Combined current value of all your investments
              </TooltipContent>
            </Tooltip>
            {/* vs S&P 500 tile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={cn("glass-card cursor-help accent-bar-green relative overflow-hidden", vsSP500 >= 0 ? "" : "")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {vsSP500 >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                      <p className="text-sm text-muted-foreground">vs S&P 500</p>
                    </div>
                    <p className={cn("text-3xl font-bold", vsSP500 >= 0 ? "text-success" : "text-destructive")}>
                      {vsSP500 >= 0 ? '+' : ''}{animVsSP500}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      You: {formatPercent(userTotalReturn)} • S&P: {formatPercent(sp500Return)}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[250px]">
                Your total return compared to the S&P 500 index over the same period
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Benchmark Comparison Chart */}
        <Card className="glass-card mb-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Performance vs Benchmarks</CardTitle>
            <div className="flex gap-1 bg-[rgba(255,255,255,0.03)] p-1 rounded-xl">
              {(['30D', '90D', 'YTD', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setBenchmarkTimeframe(tf)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold font-heading transition-all duration-150 border",
                    benchmarkTimeframe === tf
                      ? "bg-gradient-to-br from-primary to-[hsl(263,70%,50%)] text-white border-primary/30 shadow-[0_2px_8px_rgba(124,58,237,0.25)]"
                      : "text-[rgba(255,255,255,0.55)] border-transparent hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.92)]"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={benchmarkDataSets[benchmarkTimeframe]} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sp500Fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[(dataMin: number) => Math.floor((dataMin - 5000) / 1000) * 1000, (dataMax: number) => Math.ceil((dataMax + 5000) / 1000) * 1000]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="My Portfolio" fill="url(#portfolioFill)" stroke="none" />
                  <Area type="monotone" dataKey="S&P 500" fill="url(#sp500Fill)" stroke="none" />
                   <Line type="monotone" dataKey="My Portfolio" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} style={{ filter: 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.4))' }} />
                   <Line type="monotone" dataKey="S&P 500" stroke="hsl(var(--success))" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                   <Line type="monotone" dataKey="Dow Jones" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} strokeDasharray="2 2" opacity={0.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Portfolio Lists — 3 tabs */}
        <Tabs defaultValue="my-portfolios" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="my-portfolios" className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              My Portfolios
            </TabsTrigger>
            <TabsTrigger value="invested" className="flex items-center gap-1.5">
              <Handshake className="h-3.5 w-3.5" />
              Invested In
            </TabsTrigger>
            <TabsTrigger value="simulating" className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              Simulating
              {simulatingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">{simulatingCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-portfolios">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Portfolios I Created</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Switch id="validated-filter" checked={showOnlyValidated} onCheckedChange={setShowOnlyValidated} />
                  <Label htmlFor="validated-filter" className="text-sm text-muted-foreground cursor-pointer">Live only</Label>
                </div>
              </CardHeader>
              <CardContent>
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
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-muted-foreground/40">Capacity</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">
                              Percentage of maximum follower allocation reached
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMyPortfolios.map((portfolio) => (
                      <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/dashboard/portfolio/${portfolio.id}`)}>
                         <TableCell>
                          <Link to={`/dashboard/portfolio/${portfolio.id}`} className="font-medium hover:text-primary transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <GemDot name={portfolio.name} />
                            {portfolio.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn("px-2 py-1 rounded text-xs cursor-help", portfolio.status === 'validated_listed' ? "bg-success/20 text-success" : portfolio.status === 'inactive' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning")}>
                                  {portfolio.status === 'validated_listed' ? 'Live' : portfolio.status === 'inactive' ? 'Inactive' : 'Simulating'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[250px]">
                                {portfolio.status === 'validated_listed' ? 'This portfolio is actively invested with real capital' : portfolio.status === 'inactive' ? 'This portfolio has been liquidated and is no longer active' : 'This portfolio is running a live simulation with market data'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(portfolio.creator_investment)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("flex items-center justify-end gap-1", portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                            {portfolio.performance.return_30d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(portfolio.performance.return_30d)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-end gap-2 cursor-help">
                                  <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full", (portfolio.allocated_amount_usd / portfolio.capacity_limit_usd) > 0.9 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min((portfolio.allocated_amount_usd / portfolio.capacity_limit_usd) * 100, 100)}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{Math.round((portfolio.allocated_amount_usd / portfolio.capacity_limit_usd) * 100)}%</span>
                                  {portfolio.new_allocations_paused && <Pause className="h-3 w-3 text-warning" />}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                {formatCurrency(portfolio.allocated_amount_usd)} / {formatCurrency(portfolio.capacity_limit_usd)} allocated by followers
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invested">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Portfolios I've Invested In</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Link to={`/portfolio/${portfolio.id}`} state={{ from: 'dashboard' }} className="font-medium hover:text-primary transition-colors flex items-center gap-2">
                              <GemDot name={portfolio.name} />
                              {portfolio.name}
                            </Link>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive/70 shrink-0 hover:animate-[subtle-pulse_0.6s_ease] cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs max-w-[240px]">
                                  If this Alpha exits their position, your allocation will automatically follow. You may receive less than your initial investment.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
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
          </TabsContent>

          <TabsContent value="simulating">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Portfolios in Simulation</CardTitle>
              </CardHeader>
              <CardContent>
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
                        <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/simulation/${portfolio.id}`)}>
                          <TableCell>
                            <Link to={`/simulation/${portfolio.id}`} className="font-medium hover:text-primary transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <GemDot name={portfolio.name} />
                              {portfolio.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {Math.floor(Math.random() * 25) + 5} days
                          </TableCell>
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
          </TabsContent>
        </Tabs>

        {/* Financial News Feed */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Market News</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {mockNews.map((news, i) => (
              <a
                key={i}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 py-3.5 px-4 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                style={{ borderBottom: i < mockNews.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : undefined }}
              >
                {/* Thumbnail */}
                <div className="w-[72px] h-[48px] rounded-lg overflow-hidden shrink-0" style={{ background: sectorGradients[news.sector] || sectorGradients.Industrial }}>
                  <img
                    src={news.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[rgba(255,255,255,0.92)] group-hover:text-white transition-colors truncate">{news.headline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary/80">{news.tag}</span>
                  </div>
                </div>
                <ExternalLink size={14} className="text-[rgba(255,255,255,0.25)] shrink-0" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Rebalancing Mode Modal */}
      <Dialog open={rebalancingModalOpen} onOpenChange={setRebalancingModalOpen}>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rebalancing Mode</DialogTitle>
            <DialogDescription>
              Choose how portfolio updates from Alphas you follow are handled.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={rebalancingMode} onValueChange={(v) => {
            const mode = v as 'auto' | 'manual';
            setRebalancingMode(mode);
            localStorage.setItem('rebalancingMode', mode);
          }} className="space-y-3 py-4">
            <div className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer", rebalancingMode === 'auto' ? "border-primary bg-primary/5" : "border-border")}>
              <RadioGroupItem value="auto" id="auto" className="mt-0.5" />
              <Label htmlFor="auto" className="cursor-pointer">
                <p className="font-medium">Auto-apply and notify me</p>
                <p className="text-xs text-muted-foreground mt-1">Rebalancing changes are applied automatically. You'll be notified after.</p>
              </Label>
            </div>
            <div className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer", rebalancingMode === 'manual' ? "border-primary bg-primary/5" : "border-border")}>
              <RadioGroupItem value="manual" id="manual" className="mt-0.5" />
              <Label htmlFor="manual" className="cursor-pointer">
                <p className="font-medium">Require my approval</p>
                <p className="text-xs text-muted-foreground mt-1">You must review and accept each update before it applies.</p>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            By selecting Auto-apply, you authorize Alpha Trader to rebalance your portfolio automatically. This does not constitute investment advice.
          </p>
          <DialogFooter>
            <Button onClick={() => setRebalancingModalOpen(false)}>Save Preference</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
