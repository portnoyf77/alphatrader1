import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Shield, BarChart3, Wallet, ExternalLink, Tag, Briefcase, Handshake, FlaskConical, ChevronRight, ArrowUp, ArrowDown, Plus, Sparkles, Crown, X, RefreshCw, Newspaper, Clock, Bot } from 'lucide-react';
import { useAlpacaAccount } from '@/hooks/useAlpacaAccount';
import { useAlpacaPositions } from '@/hooks/useAlpacaPositions';
import { useAlpacaNews } from '@/hooks/useAlpacaNews';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageLayout } from '@/components/layout/PageLayout';
import { GemDot } from '@/components/GemDot';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useMyPortfolios, useFollowedPortfolios } from '@/hooks/usePortfolios';
import { cn, riskDisplayLabel } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { getPortfolioHistory, type AlpacaPortfolioHistoryPoint } from '@/lib/alpacaClient';

function getUserCreatedPortfolios(): any[] {
  try { return JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]'); } catch { return []; }
}

// Helper to get gem color for left border
function getGemBorderColor(name: string): string {
  if (name.startsWith('Sapphire')) return '#3B82F6';
  if (name.startsWith('Ruby')) return '#E11D48';
  if (name.startsWith('Pearl')) return '#E2E8F0';
  return 'rgba(255,255,255,0.1)';
}

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Mini Equity Chart for Dashboard ──
const PERIOD_OPTIONS = [
  { label: '1W', period: '1W', timeframe: '1D' },
  { label: '1M', period: '1M', timeframe: '1D' },
  { label: '3M', period: '3M', timeframe: '1D' },
  { label: '6M', period: '6M', timeframe: '1D' },
  { label: '1Y', period: '1A', timeframe: '1D' },
];

function DashboardEquityChart() {
  const [data, setData] = useState<AlpacaPortfolioHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('1M');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const opt = PERIOD_OPTIONS.find((o) => o.label === activePeriod) ?? PERIOD_OPTIONS[1];
    getPortfolioHistory(opt.period, opt.timeframe)
      .then((pts) => { if (!cancelled) setData(pts); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activePeriod]);

  if (loading) {
    return (
      <div className="w-full max-w-[600px] mx-auto">
        <div className="flex items-center justify-between mb-2 gap-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-7 w-9 rounded-md" />
            ))}
          </div>
        </div>
        <Skeleton className="h-[160px] w-full max-w-[600px] mx-auto rounded-xl" />
      </div>
    );
  }
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">
        Not enough data yet. Place some trades and check back.
      </div>
    );
  }

  const values = data.map((d) => d.equity);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const width = 600;
  const height = 160;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = padding + (1 - (d.equity - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1].equity >= data[0].equity;
  const strokeColor = isPositive ? '#10B981' : '#EF4444';
  const changeValue = data[data.length - 1].equity - data[0].equity;
  const changePct = data[0].equity > 0 ? (changeValue / data[0].equity) * 100 : 0;

  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
  const areaPath = `M${points[0]} ${points.slice(1).join(' ')} L${lastX},${height - padding} L${firstX},${height - padding} Z`;

  return (
    <div>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">Account Equity History</span>
          <span className="text-xs font-mono" style={{ color: strokeColor }}>
            {changeValue >= 0 ? '+' : ''}{formatCurrency(changeValue)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setActivePeriod(opt.label)}
              className={cn(
                'min-h-11 min-w-11 rounded px-2.5 text-[0.7rem] font-medium transition-colors touch-manipulation md:min-h-0 md:min-w-0 md:py-1',
                activePeriod === opt.label
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        {/* Y-axis labels outside SVG so they don't get distorted */}
        <div className="flex justify-between text-[0.7rem] font-mono text-muted-foreground mb-1">
          <span>{formatCurrency(maxVal)}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dashEquityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#dashEquityGrad)" />
          <polyline points={points.join(' ')} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-between text-[0.7rem] font-mono text-muted-foreground mt-1">
          <span>{formatCurrency(minVal)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useMockAuth();
  const [activeTab, setActiveTab] = useState<'my-portfolios' | 'invested' | 'simulating'>('my-portfolios');
  const [dismissedPublishPrompt, setDismissedPublishPrompt] = useState(false);

  // Live Alpaca data
  const { account, loading: accountLoading } = useAlpacaAccount();
  const { positions, totalMarketValue, totalUnrealizedPL, loading: positionsLoading, refetch: refetchPositions } = useAlpacaPositions();
  const alpacaLoading = accountLoading || positionsLoading;

  // Real news from Alpaca (filtered by position symbols + popular tickers)
  const newsSymbols = useMemo(() => {
    const syms = new Set(positions.map((p) => p.symbol));
    ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA'].forEach((s) => syms.add(s));
    return Array.from(syms);
  }, [positions]);
  const { articles: liveNews, loading: newsLoading, error: newsError, refetch: refetchNews } = useAlpacaNews(newsSymbols, 10);

  // Fetch portfolios from Supabase, with localStorage fallback
  const { data: supabasePortfolios, loading: portfoliosLoading } = useMyPortfolios();
  const { data: followedData, loading: followedLoading } = useFollowedPortfolios();

  const myPortfolios = useMemo(() => {
    if (supabasePortfolios.length > 0) return supabasePortfolios;
    // Fallback to localStorage during migration
    const userCreated = getUserCreatedPortfolios();
    return userCreated.map((p: any) => ({
      ...p,
      performance: p.performance || { return_30d: 0, max_drawdown: 0, consistency_score: 50 },
      creator_investment: p.creator_investment || 0,
      risk_level: p.risk_level || 'Medium',
      holdings: p.holdings || [],
    }));
  }, [supabasePortfolios]);

  const investedPortfolios = useMemo(() => {
    return followedData.map((p) => ({
      ...p,
      myReturn: 0, // Will be computed from real performance data later
    }));
  }, [followedData]);

  const simulatingPortfolios = useMemo(() =>
    myPortfolios.filter((p: any) => p.status === 'private' || p.status === 'simulating'), [myPortfolios]);

  const livePortfolios = myPortfolios.filter((s: any) => s.status !== 'private' && s.status !== 'simulating');
  const liveCount = livePortfolios.length;
  const simulatingCount = simulatingPortfolios.length;
  const totalMyInvestment = myPortfolios.reduce((acc: number, s: any) => acc + (s.creator_investment || 0), 0);
  const totalInvestedInOthers = investedPortfolios.reduce((acc, s) => acc + s.myAllocation, 0);
  const totalAllocatedInvested = investedPortfolios.reduce((acc, s) => acc + s.myAllocation, 0);

  // Use live Alpaca data when available, fall back to mock
  const displayEquity = account ? account.equity : totalMyInvestment + totalInvestedInOthers;
  const displayPortfolioValue = account ? account.portfolioValue : displayEquity;
  const displayDayPL = account ? account.dayPL : 0;
  const displayDayPLPercent = account ? account.dayPLPercent : 3.2;
  const displayCash = account ? account.cash : 0;
  const hasLiveData = !!account;

  // Use real portfolio history to compute period return when live data is available
  const [portfolioReturn, setPortfolioReturn] = useState<{ value: number; pct: number } | null>(null);
  useEffect(() => {
    if (!hasLiveData) return;
    let cancelled = false;
    getPortfolioHistory('1M', '1D')
      .then((pts) => {
        if (cancelled || pts.length < 2) return;
        const start = pts[0].equity;
        const end = pts[pts.length - 1].equity;
        const pct = start > 0 ? ((end - start) / start) * 100 : 0;
        setPortfolioReturn({ value: end - start, pct });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hasLiveData]);

  // Fetch real portfolio metrics (volatility, Sharpe, S&P 500 benchmark)
  const [metrics, setMetrics] = useState<{
    totalReturn: number; volatility: number; sharpeRatio: number;
    maxDrawdown: number; sp500Return: number; alpha: number;
  } | null>(null);
  useEffect(() => {
    if (!hasLiveData) return;
    let cancelled = false;
    fetch('/api/portfolio-metrics')
      .then(r => r.json())
      .then(data => {
        if (cancelled || data.error) return;
        setMetrics(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hasLiveData]);

  // Count-up animations
  const animEquity = useCountUp(displayEquity, 800);
  const animPortfolioValue = useCountUp(displayPortfolioValue, 800);
  // SP500 benchmark comparison - use live metrics API when available
  const sp500Return = metrics?.sp500Return ?? 9.8;
  const userTotalReturn = metrics?.totalReturn ?? (portfolioReturn ? portfolioReturn.pct : 0);
  const realVsSP500 = userTotalReturn - sp500Return;
  const animVsSP500 = useCountUp(realVsSP500, 800, 1);

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
      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* ── Account Summary + AI Activity Log ── */}
        <div data-tour="summary-stats" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Account Value */}
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:gap-10">
                {/* Account Equity */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[2.5rem] font-bold text-foreground leading-tight">
                      {alpacaLoading ? '...' : formatCurrency(animEquity)}
                    </span>
                    {hasLiveData && (
                      <span className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>Live</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground mt-1">
                    {hasLiveData ? 'Total Account Equity' : 'Total Invested'}
                  </span>
                  <div className="flex items-center gap-1 mt-2">
                    {displayDayPLPercent >= 0 ? (
                      <ArrowUp className="h-3 w-3" style={{ color: '#10B981' }} />
                    ) : (
                      <ArrowDown className="h-3 w-3" style={{ color: '#EF4444' }} />
                    )}
                    <span className="text-[0.8rem] font-medium" style={{ color: displayDayPLPercent >= 0 ? '#10B981' : '#EF4444' }}>
                      {displayDayPLPercent >= 0 ? '+' : ''}{displayDayPLPercent.toFixed(2)}%
                    </span>
                    <span className="text-[0.8rem] text-muted-foreground">
                      {hasLiveData ? 'today' : 'this month'}
                    </span>
                    {hasLiveData && displayDayPL !== 0 && (
                      <span className="text-[0.8rem] text-muted-foreground ml-1">
                        ({displayDayPL >= 0 ? '+' : ''}{formatCurrency(displayDayPL)})
                      </span>
                    )}
                  </div>
                </div>
                {/* Portfolio Value + Cash */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[1.5rem] font-bold text-foreground">
                      {alpacaLoading ? '...' : formatCurrency(animPortfolioValue)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground mt-1">
                    {hasLiveData ? 'Portfolio Value' : 'Total Value'}
                  </span>
                  {hasLiveData && (
                    <div className="flex items-center gap-1 mt-2">
                      <Wallet className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[0.8rem] text-muted-foreground">
                        {formatCurrency(displayCash)} cash available
                      </span>
                    </div>
                  )}
                </div>
                {/* vs S&P 500 */}
                <div className="flex flex-col">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-baseline gap-2 cursor-help">
                          <span className={cn(
                            "font-mono text-[1.5rem] font-bold",
                            realVsSP500 >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {realVsSP500 >= 0 ? '+' : ''}{animVsSP500}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        {portfolioReturn
                          ? `You: ${portfolioReturn.pct >= 0 ? '+' : ''}${portfolioReturn.pct.toFixed(1)}% (30d) · S&P: +${sp500Return}%`
                          : `You: ${formatPercent(userTotalReturn)} · S&P: ${formatPercent(sp500Return)}`
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-sm text-muted-foreground mt-1">vs S&P 500</span>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[0.8rem] text-muted-foreground">
                      {portfolioReturn
                        ? `You: ${portfolioReturn.pct >= 0 ? '+' : ''}${portfolioReturn.pct.toFixed(1)}% · S&P: +${sp500Return}%`
                        : `You: +${userTotalReturn}% · S&P: +${sp500Return}%`
                      }
                    </span>
                    {portfolioReturn && <span className="text-[0.65rem] text-muted-foreground ml-1">(30d)</span>}
                  </div>
                </div>
              </div>
              {/* Create New Portfolio Button */}
              <Link to="/invest" className="shrink-0 sm:self-start">
                <Button className="h-11 min-h-11 w-full gap-2 sm:w-auto md:h-10 md:min-h-10">
                  <Plus className="h-4 w-4" />
                  Create New Portfolio
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: AI Activity Log Placeholder */}
          <div
            className="rounded-2xl p-5 flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              minHeight: '180px',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Activity</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Rebalance recommendations and agent actions will appear here.
              </p>
              <p className="text-xs text-muted-foreground mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Coming soon
              </p>
            </div>
          </div>
        </div>

        {/* ── Portfolio Tab Cards ── */}
        <div data-tour="tab-cards" className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tabCards.map(({ key, icon: Icon, label, count, detail }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "min-h-[44px] rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer outline-none touch-manipulation",
                "backdrop-blur-xl",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                activeTab === key
                  ? "border-2 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                  : "border hover:border-[rgba(255,255,255,0.14)]"
              )}
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: activeTab === key ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Icon className="h-4 w-4" style={{ color: activeTab === key ? '#A78BFA' : 'rgba(255,255,255,0.55)' }} />
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

        {/* ── Tab Content ── */}
        <div key={activeTab} className="animate-in fade-in duration-200">
          {activeTab === 'my-portfolios' && (
            !hasPortfolios ? (
              <Card className="glass-card border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <CardContent className="flex flex-col items-center text-center p-6 py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" aria-hidden />
                  <h3 className="text-lg font-semibold mb-4">You haven&apos;t created a portfolio yet</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-md">
                    Build a personalized portfolio on the Invest flow and track it here alongside your live account.
                  </p>
                  <Link to="/invest">
                    <Button className="gap-2">
                      Go to Invest
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : livePortfolios.length === 0 ? (
              <div
                className="rounded-2xl border border-border/30 py-10 px-8 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <p className="text-muted-foreground text-sm mb-3">
                  You don&apos;t have any live portfolios yet. Simulating or private portfolios stay under the Simulating tab.
                </p>
                <Link to="/invest">
                  <Button variant="outline" size="sm" className="gap-2">
                    Create a portfolio
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Portfolio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">My Investment</TableHead>
                        <TableHead className="text-right">30d Return</TableHead>
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
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead className="text-right">30d Return</TableHead>
                      <TableHead className="text-right">My Allocation</TableHead>
                      <TableHead className="text-right">My Return</TableHead>
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
            <Card className="glass-card">
              <CardContent className="p-0">
                {simulatingPortfolios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">No portfolios currently simulating.</p>
                    <Link to="/invest" className="text-primary hover:underline text-sm">Create a new portfolio &rarr;</Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Portfolio</TableHead>
                        <TableHead>Sim. Duration</TableHead>
                        <TableHead className="text-right">Sim. Return</TableHead>
                        <TableHead className="text-right">Worst Drop</TableHead>
                        <TableHead className="text-right">Risk Level</TableHead>
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
        </div>

        {/* ── Equity Chart (when live data available) ── */}
        {hasLiveData && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
          >
            <DashboardEquityChart />
          </div>
        )}

        {/* ── Risk Metrics (when live data + metrics available) ── */}
        {hasLiveData && metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-2">Volatility</p>
              <p className="font-mono text-lg font-semibold">{(metrics.volatility * 100).toFixed(1)}%</p>
              <p className="text-[0.7rem] text-muted-foreground">annualized</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-2">Sharpe Ratio</p>
              <p className={cn("font-mono text-lg font-semibold", metrics.sharpeRatio >= 1 ? 'text-success' : metrics.sharpeRatio >= 0 ? 'text-foreground' : 'text-destructive')}>
                {metrics.sharpeRatio.toFixed(2)}
              </p>
              <p className="text-[0.7rem] text-muted-foreground">risk-adjusted</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-2">Max Drawdown</p>
              <p className="font-mono text-lg font-semibold text-destructive">
                {(metrics.maxDrawdown * 100).toFixed(1)}%
              </p>
              <p className="text-[0.7rem] text-muted-foreground">worst decline</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-2">Alpha</p>
              <p className={cn("font-mono text-lg font-semibold", metrics.alpha >= 0 ? 'text-success' : 'text-destructive')}>
                {metrics.alpha >= 0 ? '+' : ''}{(metrics.alpha * 100).toFixed(1)}%
              </p>
              <p className="text-[0.7rem] text-muted-foreground">vs S&P 500</p>
            </div>
          </div>
        )}

        {/* ── Contextual Alpha Promotion ── */}
        {qualifyingPortfolio && (
          <div
            className="flex flex-col gap-4 rounded-xl p-6 sm:flex-row sm:items-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '3px solid hsl(var(--primary))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <Crown className="h-5 w-5 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                Your portfolio <span className="font-semibold">{qualifyingPortfolio.name}</span> qualifies for the marketplace. Publish it and start earning when others follow.
              </p>
            </div>
            <Link to="/invest" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="min-h-11 w-full whitespace-nowrap text-xs touch-manipulation sm:w-auto md:min-h-9">
                Learn How &rarr;
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setDismissedPublishPrompt(true)}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center self-end rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:self-auto md:min-h-10 md:min-w-10 md:p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Live Alpaca Positions ── */}
        {hasLiveData && positions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Live Positions</h2>
                <span className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                  {positions.length} open
                </span>
              </div>
              <Link to="/portfolio-tracker" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {positions.slice(0, 8).map((pos) => (
                <div
                  key={pos.symbol}
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${pos.unrealizedPL >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold text-sm text-foreground">{pos.symbol}</span>
                    <span className="text-xs text-muted-foreground">{pos.qty} shares</span>
                  </div>
                  <div className="font-mono text-sm text-foreground">{formatCurrency(pos.marketValue)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {pos.unrealizedPL >= 0 ? (
                      <ArrowUp className="h-3 w-3" style={{ color: '#10B981' }} />
                    ) : (
                      <ArrowDown className="h-3 w-3" style={{ color: '#EF4444' }} />
                    )}
                    <span className="text-xs font-medium" style={{ color: pos.unrealizedPL >= 0 ? '#10B981' : '#EF4444' }}>
                      {pos.unrealizedPL >= 0 ? '+' : ''}{formatCurrency(pos.unrealizedPL)} ({pos.unrealizedPLPercent >= 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {totalUnrealizedPL !== 0 && (
              <div className="mt-2 text-right">
                <span className="text-xs text-muted-foreground">Total unrealized P&L: </span>
                <span className="text-xs font-mono font-medium" style={{ color: totalUnrealizedPL >= 0 ? '#10B981' : '#EF4444' }}>
                  {totalUnrealizedPL >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPL)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Market News ── */}
        <div data-tour="market-news">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-muted-foreground" />
              Market News
              <span className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>Live</span>
            </h2>
            <Link to="/research" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background px-1 py-0.5 -mx-1">
              Full research <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {newsLoading && liveNews.length === 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 py-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[280px] min-w-[280px] max-w-[280px] shrink-0 rounded-xl" />
              ))}
            </div>
          ) : liveNews.length === 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 px-2">
              <span className="text-sm text-muted-foreground text-center">
                {newsError ? `News feed unavailable: ${newsError}` : 'No recent news available.'}
              </span>
              {newsError && (
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => refetchNews()}>
                  Retry
                </Button>
              )}
            </div>
          ) : (
            <div
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              <style>{`
                .news-carousel::-webkit-scrollbar { height: 4px; }
                .news-carousel::-webkit-scrollbar-track { background: transparent; }
                .news-carousel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
              `}</style>
              {liveNews.map((article) => {
                const positionSymbols = positions.map((p) => p.symbol);
                const relevantSymbols = article.symbols.filter((s) => positionSymbols.includes(s));
                const thumbImg = article.images?.find((img) => img.size === 'thumb') ?? article.images?.find((img) => img.size === 'small') ?? article.images?.[0];
                return (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-carousel group flex-shrink-0 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    style={{
                      minWidth: '280px',
                      maxWidth: '280px',
                      height: '280px',
                      scrollSnapAlign: 'start',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    {thumbImg?.url && (
                      <div
                        className="w-full flex-shrink-0 bg-cover bg-center"
                        style={{
                          height: '140px',
                          backgroundImage: `url(${thumbImg.url})`,
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                    )}
                    <div className="p-6 flex flex-col gap-2 flex-1 min-h-0">
                      <p
                        className="text-[0.85rem] font-semibold text-foreground leading-snug group-hover:text-white transition-colors"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: thumbImg?.url ? 2 : 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {article.headline}
                      </p>
                      {!thumbImg?.url && article.summary && (
                        <p
                          className="text-[0.75rem] text-muted-foreground leading-relaxed flex-1"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {article.summary}
                        </p>
                      )}
                      {article.symbols.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {article.symbols.slice(0, 4).map((sym) => (
                            <span
                              key={sym}
                              className="text-[0.6rem] font-mono px-1.5 py-0.5 rounded"
                              style={{
                                background: relevantSymbols.includes(sym) ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                                color: relevantSymbols.includes(sym) ? '#A78BFA' : 'rgba(255,255,255,0.55)',
                                border: `1px solid ${relevantSymbols.includes(sym) ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)'}`,
                              }}
                            >
                              {sym}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[0.7rem] mt-auto">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{article.source}</span>
                        <span className="text-muted-foreground">&middot;</span>
                        <span className="text-muted-foreground">{timeSince(article.created_at)}</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
