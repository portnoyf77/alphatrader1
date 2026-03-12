import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, CheckCircle2, Info, Trophy, Crown, Star, Users, DollarSign, Clock } from 'lucide-react';
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
import { getValidatedStrategies, formatCurrency, formatPercent } from '@/lib/mockData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ObjectiveFilter = 'all' | 'Growth' | 'Income' | 'Balanced' | 'Low volatility';
type RiskFilter = 'all' | 'Low' | 'Medium' | 'High';
type StrategyFilter = 'all' | 'GenAI' | 'Manual';
type VisibilityFilter = 'all' | 'masked' | 'transparent';
type TurnoverFilter = 'all' | 'low' | 'medium' | 'high';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [turnoverFilter, setTurnoverFilter] = useState<TurnoverFilter>('all');

  const validatedStrategies = useMemo(() => getValidatedStrategies(), []);

  // Top 5 strategies by risk-adjusted returns for the leaderboard chart
  const leaderboardData = useMemo(() => {
    return [...validatedStrategies]
      .sort((a, b) => (b.performance.return_90d / b.performance.volatility) - (a.performance.return_90d / a.performance.volatility))
      .slice(0, 5)
      .map((strategy, index) => ({
        name: strategy.name,
        id: strategy.id,
        return30d: strategy.performance.return_30d,
        riskAdjusted: (strategy.performance.return_90d / strategy.performance.volatility).toFixed(2),
        rank: index + 1,
      }));
  }, [validatedStrategies]);

  // Alpha leaderboard ranking by composite score
  const alphaLeaderboard = useMemo(() => {
    return [...validatedStrategies]
      .map((s) => {
        const trackRecordDays = Math.floor((Date.now() - new Date(s.created_date).getTime()) / (1000 * 60 * 60 * 24));
        const baseScore = s.performance.consistency_score * 2.5;
        const trackRecord = Math.min(trackRecordDays / 365, 1) * 1.0;
        const followerBonus = Math.min(s.followers_count / 1000, 1) * 0.5;
        const reputationScore = Math.min(5.0, baseScore + trackRecord + followerBonus);
        return {
          ...s,
          trackRecordDays,
          reputationScore: Number(reputationScore.toFixed(1)),
        };
      })
      .sort((a, b) => {
        // Composite: followers weight + allocated weight + earnings weight + track record weight
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

  // Gemstone-themed bar colors for top performers
  const gemstoneBarColors: Record<string, string> = {
    'Sapphire': 'hsl(217 91% 60%)',
    'Pearl': 'hsl(240 5% 80%)',
    'Emerald': 'hsl(160 84% 39%)',
    'Amber': 'hsl(38 92% 50%)',
    'Opal': 'hsl(300 60% 70%)',
    'Diamond': 'hsl(262 83% 58%)',
    'Peridot': 'hsl(120 40% 55%)',
    'Topaz': 'hsl(40 80% 55%)',
    'Quartz': 'hsl(0 0% 70%)',
  };

  const getBarColor = (name: string) => {
    const gemName = name.split('-')[0];
    return gemstoneBarColors[gemName] || 'hsl(262 83% 58%)';
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Risk Profile</label>
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
          <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
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
          <p className="text-xs text-muted-foreground">30d Return: <span className="text-success font-medium">{payload[0].value.toFixed(1)}%</span></p>
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
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <div className="flex items-start gap-2">
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
        </div>

        {/* Main Tabs: All Portfolios | Leaderboard */}
        <Tabs defaultValue="all-portfolios" className="mb-8">
          <TabsList className="bg-secondary mb-6">
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-sm">Ranked by risk-adjusted returns (return divided by volatility). Higher is better.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">Top 5 portfolios by risk-adjusted performance</p>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaderboardData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" tickFormatter={(value) => `${value}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120} 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                      <Bar dataKey="return30d" radius={[0, 4, 4, 0]}>
                        {leaderboardData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} className="cursor-pointer" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {leaderboardData.map((strategy, index) => (
                    <Link 
                      key={strategy.id}
                      to={`/portfolio/${strategy.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-xs"
                    >
                      <span className="font-bold text-primary">#{index + 1}</span>
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
                  <SelectTrigger className="w-[140px] bg-secondary"><SelectValue placeholder="Risk" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
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
            <Card className="glass-card">
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
                        <span className="flex items-center gap-1 justify-center"><Star className="h-3 w-3" /> Score</span>
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
                            <p className="font-medium">{alpha.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{alpha.creator_id}</p>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-sm font-semibold">
                            <Crown className="h-3 w-3" />
                            {alpha.reputationScore}
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