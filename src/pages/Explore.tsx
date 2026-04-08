import { useState, useMemo } from 'react';
import { Search, X, CheckCircle2, Info, Trophy, Crown, Users, DollarSign, Clock, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/layout/PageLayout';
import { StrategyCard } from '@/components/StrategyCard';
import { GemDot } from '@/components/GemDot';
import { MarketplaceHelpButton } from '@/components/MarketplaceHelpModal';
import { TopPerformerCard } from '@/components/TopPerformerCard';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useValidatedPortfolios } from '@/hooks/usePortfolios';
import { getGemHex } from '@/lib/portfolioNaming';
import { calculateAlphaScore } from '@/lib/alphaScore';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Hardcoded time-period returns for ranking shifts
const timeReturns: Record<string, Record<ChartTimeframe, number>> = {
  'Ruby-891':      { '30D': 6.2, '90D': 12.8, 'YTD': 18.1, '1Y': 21.5 },
  'Sapphire-347':  { '30D': 4.2, '90D': 13.3, 'YTD': 22.7, '1Y': 28.2 },
  'Sapphire-489':  { '30D': 3.4, '90D': 8.9,  'YTD': 12.4, '1Y': 16.8 },
  'Sapphire-412':  { '30D': 2.9, '90D': 10.7, 'YTD': 19.2, '1Y': 26.1 },
  'Sapphire-385':  { '30D': 2.1, '90D': 7.2,  'YTD': 11.8, '1Y': 15.3 },
  'Pearl-142':     { '30D': 1.8, '90D': 6.8,  'YTD': 13.2, '1Y': 24.7 },
  'Pearl-217':     { '30D': 1.5, '90D': 4.9,  'YTD': 8.1,  '1Y': 12.4 },
  'Pearl-108':     { '30D': 1.2, '90D': 5.1,  'YTD': 10.5, '1Y': 22.2 },
  'Pearl-127':     { '30D': 0.8, '90D': 3.2,  'YTD': 6.8,  '1Y': 10.5 },
};

type RiskFilter = 'all' | 'Low' | 'Medium' | 'High';
type TurnoverFilter = 'all' | 'low' | 'medium' | 'high';
type SortOption = '30d_return' | 'followers' | 'allocated' | 'alpha_score' | 'worst_drop' | 'creator_investment';
type ChartTimeframe = '30D' | '90D' | 'YTD' | '1Y';

const timeframeLabels: Record<ChartTimeframe, string> = {
  '30D': 'last 30 days',
  '90D': 'last 90 days',
  'YTD': 'year to date',
  '1Y': 'last 12 months',
};

const sortLabels: Record<SortOption, string> = {
  '30d_return': '30d Return',
  'followers': 'Followers',
  'allocated': 'Total Allocated',
  'alpha_score': 'Alpha Score',
  'worst_drop': 'Worst Drop',
  'creator_investment': "Alpha's Investment",
};

const riskFilterLabels: Record<string, string> = {
  'Low': 'Conservative (Pearl)',
  'Medium': 'Moderate (Sapphire)',
  'High': 'Aggressive (Ruby)',
};

const turnoverFilterLabels: Record<string, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
};

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [turnoverFilter, setTurnoverFilter] = useState<TurnoverFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('30d_return');
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('30D');

  const { data: validatedStrategies, loading: strategiesLoading } = useValidatedPortfolios();

  const getReturnForTimeframe = (portfolio: any, tf: ChartTimeframe) => {
    const returns = timeReturns[portfolio.name];
    if (returns) return returns[tf];
    return portfolio.performance.return_30d;
  };

  const topPerformers = useMemo(() => {
    return [...validatedStrategies]
      .sort((a, b) => getReturnForTimeframe(b, chartTimeframe) - getReturnForTimeframe(a, chartTimeframe))
      .slice(0, 5);
  }, [validatedStrategies, chartTimeframe]);

  const timeLabels: Record<ChartTimeframe, string> = {
    '30D': '30d return',
    '90D': '90d return',
    'YTD': 'YTD return',
    '1Y': '1Y return',
  };

  const alphaLeaderboard = useMemo(() => {
    return [...validatedStrategies]
      .map((s) => {
        const trackRecordDays = Math.floor((Date.now() - new Date(s.created_date).getTime()) / (1000 * 60 * 60 * 24));
        const reputationScore = calculateAlphaScore(s);
        return {
          ...s,
          trackRecordDays,
          reputationScore: Number(reputationScore.toFixed(1)),
        };
      })
      .sort((a, b) => {
        const scoreA = a.followers_count * 0.3 + a.allocated_amount_usd * 0.0001 + a.creator_est_monthly_earnings_usd * 0.5 + a.trackRecordDays * 0.01;
        const scoreB = b.followers_count * 0.3 + b.allocated_amount_usd * 0.0001 + b.creator_est_monthly_earnings_usd * 0.5 + b.trackRecordDays * 0.01;
        return scoreB - scoreA;
      });
  }, [validatedStrategies]);

  const filteredStrategies = useMemo(() => {
    const filtered = validatedStrategies.filter(strategy => {
      const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.creator_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = riskFilter === 'all' || strategy.risk_level === riskFilter;
      const matchesTurnover = turnoverFilter === 'all' || strategy.turnover_estimate === turnoverFilter;
      return matchesSearch && matchesRisk && matchesTurnover;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case '30d_return':
          return b.performance.return_30d - a.performance.return_30d;
        case 'followers':
          return b.followers_count - a.followers_count;
        case 'allocated':
          return b.allocated_amount_usd - a.allocated_amount_usd;
        case 'alpha_score':
          return calculateAlphaScore(b) - calculateAlphaScore(a);
        case 'worst_drop':
          // Least negative first (smallest drop = best)
          return b.performance.max_drawdown - a.performance.max_drawdown;
        case 'creator_investment':
          return b.creator_investment - a.creator_investment;
        default:
          return 0;
      }
    });

    return filtered;
  }, [validatedStrategies, searchQuery, riskFilter, turnoverFilter, sortBy]);

  const hasActiveFilters = riskFilter !== 'all' || turnoverFilter !== 'all' || sortBy !== '30d_return';
  const hasActiveFiltersPure = riskFilter !== 'all' || turnoverFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setRiskFilter('all');
    setTurnoverFilter('all');
    setSortBy('30d_return');
  };

  // Mobile filter content
  const MobileFilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Risk Profile</label>
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="Low">Conservative (Pearl)</SelectItem>
            <SelectItem value="Medium">Moderate (Sapphire)</SelectItem>
            <SelectItem value="High">Aggressive (Ruby)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Turnover</label>
        <Select value={turnoverFilter} onValueChange={(v) => setTurnoverFilter(v as TurnoverFilter)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Turnover</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Sort by</label>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30d_return">30d Return</SelectItem>
            <SelectItem value="followers">Followers</SelectItem>
            <SelectItem value="allocated">Total Allocated</SelectItem>
            <SelectItem value="alpha_score">Alpha Score</SelectItem>
            <SelectItem value="worst_drop">Worst Drop</SelectItem>
            <SelectItem value="creator_investment">Alpha's Investment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full"><X className="h-4 w-4 mr-2" />Clear Filters</Button>
      )}
    </div>
  );

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* ═══ SECTION 1: Page Header ═══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-heading text-[2rem] font-bold">Marketplace</h1>
            <MarketplaceHelpButton />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>All portfolios here are validated and eligible to follow.</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-success/20 transition-colors ml-1"><Info className="h-3.5 w-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">Only validated portfolios appear here. Portfolios must complete a validation period demonstrating consistent performance before being publicly listed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="all-portfolios">
          <TabsList className="mb-6">
            <TabsTrigger value="all-portfolios">All Portfolios</TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-1.5" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-portfolios">
            {/* ═══ SECTION 2: Top Performers ═══ */}
            <div
              className="rounded-2xl mb-10 p-6"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-lg font-semibold">Top Performers</h2>
                </div>
                <div className="flex items-center gap-1">
                  {(['30D', '90D', 'YTD', '1Y'] as ChartTimeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setChartTimeframe(tf)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        chartTimeframe === tf
                          ? "bg-gradient-to-br from-primary to-[hsl(263,70%,50%)] text-primary-foreground shadow-[0_2px_8px_rgba(124,58,237,0.3)]"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Top 5 portfolios by return — {timeframeLabels[chartTimeframe]}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 md:overflow-visible">
                {topPerformers.map((portfolio, index) => (
                  <TopPerformerCard
                    key={`${chartTimeframe}-${portfolio.id}`}
                    portfolio={portfolio}
                    rank={index + 1}
                    returnValue={getReturnForTimeframe(portfolio, chartTimeframe)}
                    timeLabel={timeLabels[chartTimeframe]}
                    isAnimating
                  />
                ))}
              </div>
            </div>

            {/* ═══ SECTION 3: Visual Divider ═══ */}
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-heading text-[1.25rem] font-semibold whitespace-nowrap">Browse All Portfolios</h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* ═══ SECTION 4: Sticky Filter Toolbar ═══ */}
            <div
              className="sticky top-16 z-30 mb-6 rounded-xl"
              style={{
                background: 'rgba(5,5,8,0.85)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                padding: '12px 16px',
              }}
            >
              {/* Desktop toolbar */}
              <div className="hidden md:flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search portfolios or creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 border-border/30"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  />
                </div>
                <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
                  <SelectTrigger className="w-[180px] h-9 border-border/30" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <SelectValue placeholder="All Risk Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="Low">Conservative (Pearl)</SelectItem>
                    <SelectItem value="Medium">Moderate (Sapphire)</SelectItem>
                    <SelectItem value="High">Aggressive (Ruby)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={turnoverFilter} onValueChange={(v) => setTurnoverFilter(v as TurnoverFilter)}>
                  <SelectTrigger className="w-[150px] h-9 border-border/30" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <SelectValue placeholder="All Turnover" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Turnover</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[190px] h-9 border-border/30" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d_return">Sort by: 30d Return</SelectItem>
                    <SelectItem value="followers">Sort by: Followers</SelectItem>
                    <SelectItem value="allocated">Sort by: Total Allocated</SelectItem>
                    <SelectItem value="alpha_score">Sort by: Alpha Score</SelectItem>
                    <SelectItem value="worst_drop">Sort by: Worst Drop</SelectItem>
                    <SelectItem value="creator_investment">Sort by: Alpha's Investment</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {filteredStrategies.length} portfolio{filteredStrategies.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Mobile toolbar */}
              <div className="md:hidden flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 border-border/30"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  />
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 shrink-0">
                      <SlidersHorizontal className="h-4 w-4 mr-1.5" />Filters
                      {hasActiveFiltersPure && <span className="ml-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">!</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent><SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader><div className="mt-6"><MobileFilterContent /></div></SheetContent>
                </Sheet>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {filteredStrategies.length}
                </span>
              </div>

              {/* Active filter pills */}
              {(hasActiveFiltersPure || sortBy !== '30d_return') && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {riskFilter !== 'all' && (
                    <button
                      onClick={() => setRiskFilter('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      Risk: {riskFilterLabels[riskFilter]}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {turnoverFilter !== 'all' && (
                    <button
                      onClick={() => setTurnoverFilter('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      Turnover: {turnoverFilterLabels[turnoverFilter]}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {sortBy !== '30d_return' && (
                    <button
                      onClick={() => setSortBy('30d_return')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      Sorted by: {sortLabels[sortBy]}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ═══ Portfolio Grid ═══ */}
            {filteredStrategies.length > 0 ? (
              <>
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                  {filteredStrategies.map((strategy) => (
                    <StrategyCard key={strategy.id} strategy={strategy} />
                  ))}
                </div>

                {/* Build Your Own CTA */}
                <div className="mt-12 text-center py-10 rounded-2xl border border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-muted-foreground mb-1">Don't see what you're looking for?</p>
                  <p className="text-sm text-muted-foreground mb-4">Build your own portfolio with AI in minutes.</p>
                  <Link to="/invest">
                    <Button className="gap-2">
                      Create Portfolio
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-2">No portfolios match your filters.</p>
                <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filters.</p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </TabsContent>

          {/* ═══ LEADERBOARD TAB ═══ */}
          <TabsContent value="leaderboard">
            <Card className="glass-card leaderboard-striped">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Alpha Leaderboard
                </CardTitle>
                <p className="text-sm text-muted-foreground">Ranked by composite score: follower count, total allocated, monthly earnings, and track record length.</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Alpha</TableHead>
                      <TableHead className="text-center">
                        <span className="flex items-center gap-1 justify-center"><Crown className="h-3 w-3" /> Score</span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="flex items-center gap-1 justify-end"><Users className="h-3 w-3" /> Followers</span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="flex items-center gap-1 justify-end"><DollarSign className="h-3 w-3" /> Total Allocated</span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="flex items-center gap-1 justify-end"><DollarSign className="h-3 w-3" /> Monthly Earnings</span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> Track Record</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alphaLeaderboard.map((alpha, index) => (
                      <TableRow key={alpha.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell>
                          <span className={cn(
                            "font-bold",
                            index === 0 && "text-yellow-400",
                            index === 1 && "text-gray-400",
                            index === 2 && "text-amber-600"
                          )}>
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link to={`/portfolio/${alpha.id}`} className="hover:text-primary transition-colors">
                            <p className="font-medium flex items-center gap-2"><GemDot name={alpha.name} />{alpha.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{alpha.creator_id}</p>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-semibold"
                            style={{ backgroundColor: `${getGemHex(alpha.name).glow}`, color: getGemHex(alpha.name).color }}
                          >
                            <Crown className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono">{alpha.reputationScore}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{alpha.followers_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(alpha.allocated_amount_usd)}</TableCell>
                        <TableCell className="text-right font-medium text-primary">${alpha.creator_est_monthly_earnings_usd.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{alpha.trackRecordDays}d</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

// Inline "Learn more" link that opens the help modal
function MarketplaceHelpInlineLink() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="underline hover:text-blue-300 transition-colors"
      >
        Learn more
      </button>
      {open && <MarketplaceHelpInlineModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

// Reuse the help modal content inline
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GemDot as GemDotInline } from '@/components/GemDot';

function MarketplaceHelpInlineModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-elevated max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">How the Marketplace Works</DialogTitle>
          <DialogDescription className="sr-only">
            Information about following portfolios, fees, risk levels, and rebalancing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <section>
            <h4 className="font-semibold text-foreground mb-2">Following a Portfolio</h4>
            <p className="text-muted-foreground">
              When you allocate capital to an Alpha's portfolio, your investment automatically mirrors their
              holdings and any changes they make. You don't need to manage individual trades.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-foreground mb-2">Fees</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Alpha fee: 0.25% of your allocation annually (paid to the portfolio creator)</li>
              <li>• Platform fee: 0.25% of your allocation annually</li>
              <li>• Total cost: 0.50% annually</li>
            </ul>
          </section>
          <section>
            <h4 className="font-semibold text-foreground mb-2">Risk Levels</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <GemDotInline name="Pearl-000" size={14} showTooltip={false} />
                <span><strong className="text-foreground">Pearl — Conservative:</strong> focused on capital preservation and low volatility</span>
              </li>
              <li className="flex items-center gap-2">
                <GemDotInline name="Sapphire-000" size={14} showTooltip={false} />
                <span><strong className="text-foreground">Sapphire — Moderate:</strong> balances growth and stability</span>
              </li>
              <li className="flex items-center gap-2">
                <GemDotInline name="Ruby-000" size={14} showTooltip={false} />
                <span><strong className="text-foreground">Ruby — Aggressive:</strong> pursues maximum growth with higher risk</span>
              </li>
            </ul>
          </section>
          <section>
            <h4 className="font-semibold text-foreground mb-2">What happens if the Alpha exits?</h4>
            <p className="text-muted-foreground">
              If an Alpha liquidates their portfolio, your allocation automatically exits as well.
              You will be notified immediately. You may receive less than your initial investment.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-foreground mb-2">Rebalancing</h4>
            <p className="text-muted-foreground">
              Alphas may periodically rebalance their portfolios. By default, minor changes apply
              automatically and you are notified. You can change this to require your approval in
              Dashboard settings.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-foreground mb-2">Validation Requirements</h4>
            <p className="text-muted-foreground">
              All portfolios listed on the marketplace have met minimum requirements: 30+ day track record,
              maximum drawdown under 20%, at least 5 unique holdings, and verified creator.
            </p>
          </section>
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
