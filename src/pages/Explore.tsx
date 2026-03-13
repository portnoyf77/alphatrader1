import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, CheckCircle2, Info, Trophy, Crown, Users, DollarSign, Clock } from 'lucide-react';
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
import { getValidatedStrategies, formatCurrency, formatPercent } from '@/lib/mockData';
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

type ObjectiveFilter = 'all' | 'Growth' | 'Income' | 'Balanced' | 'Low volatility';
type RiskFilter = 'all' | 'Low' | 'Medium' | 'High';
type StrategyFilter = 'all' | 'GenAI' | 'Manual';
type VisibilityFilter = 'all' | 'masked' | 'transparent';
type TurnoverFilter = 'all' | 'low' | 'medium' | 'high';
type ChartTimeframe = '30D' | '90D' | 'YTD' | '1Y';

const timeframeLabels: Record<ChartTimeframe, string> = {
  '30D': 'last 30 days',
  '90D': 'last 90 days',
  'YTD': 'year to date',
  '1Y': 'last 12 months',
};

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [turnoverFilter, setTurnoverFilter] = useState<TurnoverFilter>('all');
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('30D');

  const validatedStrategies = useMemo(() => getValidatedStrategies(), []);

  // Return key based on timeframe
  const getReturnForTimeframe = (strategy: any, tf: ChartTimeframe) => {
    switch (tf) {
      case '30D': return strategy.performance.return_30d;
      case '90D': return strategy.performance.return_90d;
      case 'YTD': return strategy.performance.return_90d * 1.2; // simulated
      case '1Y': return strategy.performance.return_90d * 2.5; // simulated
      default: return strategy.performance.return_30d;
    }
  };

  // Top 5 strategies by return for selected timeframe
  const leaderboardData = useMemo(() => {
    return [...validatedStrategies]
      .sort((a, b) => getReturnForTimeframe(b, chartTimeframe) - getReturnForTimeframe(a, chartTimeframe))
      .slice(0, 5)
      .map((strategy) => ({
        name: strategy.name,
        id: strategy.id,
        returnValue: Number(getReturnForTimeframe(strategy, chartTimeframe).toFixed(1)),
        riskAdjusted: (strategy.performance.return_90d / strategy.performance.volatility).toFixed(2),
      }));
  }, [validatedStrategies, chartTimeframe]);

  // Alpha leaderboard ranking by composite score
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
    return validatedStrategies.filter(strategy => {
      const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.creator_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesObjective = objectiveFilter === 'all' || strategy.objective === objectiveFilter;
      const matchesRisk = riskFilter === 'all' || strategy.risk_level === riskFilter;
      const matchesStrategy = strategyFilter === 'all' || strategy.strategy_type === strategyFilter;
      const matchesVisibility = visibilityFilter === 'all' || strategy.visibility_mode === visibilityFilter;
      const matchesTurnover = turnoverFilter === 'all' || strategy.turnover_estimate === turnoverFilter;

      return matchesSearch && matchesObjective && matchesRisk && matchesStrategy && matchesVisibility && matchesTurnover;
    });
  }, [validatedStrategies, searchQuery, objectiveFilter, riskFilter, strategyFilter, visibilityFilter, turnoverFilter]);

  const hasActiveFilters = objectiveFilter !== 'all' || riskFilter !== 'all' || strategyFilter !== 'all' || visibilityFilter !== 'all' || turnoverFilter !== 'all';

  const clearFilters = () => {
    setObjectiveFilter('all');
    setRiskFilter('all');
    setStrategyFilter('all');
    setVisibilityFilter('all');
    setTurnoverFilter('all');
  };


  const FilterContent = () => (
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
        <label className="text-sm font-medium">Objective</label>
        <Select value={objectiveFilter} onValueChange={(v) => setObjectiveFilter(v as ObjectiveFilter)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Objectives</SelectItem>
            <SelectItem value="Growth">Growth</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Balanced">Balanced</SelectItem>
            <SelectItem value="Low volatility">Low Volatility</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Visibility</label>
        <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as VisibilityFilter)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="masked">Masked (IP-Protected)</SelectItem>
            <SelectItem value="transparent">Transparent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Turnover</label>
        <Select value={turnoverFilter} onValueChange={(v) => setTurnoverFilter(v as TurnoverFilter)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Portfolio Type</label>
        <Select value={strategyFilter} onValueChange={(v) => setStrategyFilter(v as StrategyFilter)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="GenAI">GenAI</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full"><X className="h-4 w-4 mr-2" />Clear Filters</Button>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{payload[0].payload.name}</p>
          <p className="text-xs text-muted-foreground">Return: <span className="text-success font-medium">{payload[0].value.toFixed(1)}%</span></p>
          <p className="text-xs text-muted-foreground">Risk-Adjusted: <span className="text-primary font-medium">{payload[0].payload.riskAdjusted}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <MarketplaceHelpButton />
          </div>
          <div className="flex items-start gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
              <CheckCircle2 className="h-4 w-4" />
              All portfolios here are validated and eligible to accept allocations.
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Info className="h-4 w-4 text-muted-foreground" /></button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">Only validated portfolios appear here. Portfolios must complete a validation period demonstrating consistent performance before being publicly listed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* Allocation mirroring info banner */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              When you allocate to a portfolio, your position automatically mirrors the Alpha's actions, including exits.{' '}
              <MarketplaceHelpInlineLink />
            </span>
          </div>
        </div>

        {/* Main Tabs: All Portfolios | Leaderboard */}
        <Tabs defaultValue="all-portfolios" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="all-portfolios">All Portfolios</TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-1.5" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-portfolios">
            {/* Top Performers Bar Chart */}
            <Card className="mb-8 bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Top Performers</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['30D', '90D', 'YTD', '1Y'] as ChartTimeframe[]).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setChartTimeframe(tf)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-medium transition-all",
                          chartTimeframe === tf
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Top 5 portfolios by return — {timeframeLabels[chartTimeframe]}
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={leaderboardData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      onClick={(data) => {
                        if (data?.activePayload?.[0]?.payload?.id) {
                          navigate(`/portfolio/${data.activePayload[0].payload.id}`);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <XAxis type="number" tickFormatter={(value) => `${value}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120} 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                        tick={({ x, y, payload }: any) => {
                          const entry = leaderboardData.find(d => d.name === payload.value);
                          return (
                            <text
                              x={x}
                              y={y}
                              dy={4}
                              textAnchor="end"
                              fill="hsl(var(--muted-foreground))"
                              fontSize={12}
                              style={{ cursor: 'pointer' }}
                              onClick={() => entry && navigate(`/portfolio/${entry.id}`)}
                            >
                              {payload.value.length > 15 ? `${payload.value.slice(0, 15)}...` : payload.value}
                            </text>
                          );
                        }}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                      <Bar dataKey="returnValue" radius={[0, 4, 4, 0]}>
                        {leaderboardData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(entry.name)}
                            className="cursor-pointer hover:brightness-115"
                            style={{ filter: 'brightness(1)', transition: 'filter 0.2s' }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {leaderboardData.map((strategy) => (
                    <Link 
                      key={strategy.id}
                      to={`/portfolio/${strategy.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-xs"
                    >
                      <GemDot name={strategy.name} size={6} />
                      <span className="text-foreground">{strategy.name}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search portfolios or creators..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary" />
              </div>
              <div className="hidden lg:flex gap-3">
                <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
                  <SelectTrigger className="w-[180px] bg-secondary"><SelectValue placeholder="Risk" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="Low">Conservative (Pearl)</SelectItem>
                    <SelectItem value="Medium">Moderate (Sapphire)</SelectItem>
                    <SelectItem value="High">Aggressive (Ruby)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as VisibilityFilter)}>
                  <SelectTrigger className="w-[140px] bg-secondary"><SelectValue placeholder="Visibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visibility</SelectItem>
                    <SelectItem value="masked">Masked</SelectItem>
                    <SelectItem value="transparent">Transparent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={turnoverFilter} onValueChange={(v) => setTurnoverFilter(v as TurnoverFilter)}>
                  <SelectTrigger className="w-[140px] bg-secondary"><SelectValue placeholder="Turnover" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Turnover</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && <Button variant="ghost" onClick={clearFilters} size="icon"><X className="h-4 w-4" /></Button>}
              </div>
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />Filters
                      {hasActiveFilters && <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">!</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent><SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader><div className="mt-6"><FilterContent /></div></SheetContent>
                </Sheet>
              </div>
            </div>

            {filteredStrategies.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStrategies.map((strategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">No portfolios match your filters.</p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </TabsContent>

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
