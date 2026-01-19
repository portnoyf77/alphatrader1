import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, DollarSign, TrendingUp, Users, Sparkles, Wrench, Trophy, ArrowUpRight, Shield, Filter, Pause, Info, BarChart3, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageLayout } from '@/components/layout/PageLayout';
import { ValidationBadge } from '@/components/ValidationBadge';
import { StrategyControls } from '@/components/StrategyControls';
import { PendingUpdatesPanel } from '@/components/PendingUpdatesPanel';
import { formatCurrency, formatPercent, mockStrategies, mockEarningsHistory, mockInvestorGrowth, getStrategiesWithPendingUpdates } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const myStrategies = mockStrategies.slice(0, 4);
const mockEarnings = { totalEarnings: 7580, last30Days: 2340, topStrategy: myStrategies[0] };
const creatorRank = 3;
const totalCreators = 47;

export default function Dashboard() {
  const [showOnlyValidated, setShowOnlyValidated] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(myStrategies[0]);

  const filteredStrategies = showOnlyValidated 
    ? myStrategies.filter(s => s.validation_status === 'validated' && s.validation_criteria_met && s.status === 'validated_listed')
    : myStrategies;

  const totalFollowers = myStrategies.reduce((acc, s) => acc + s.followers_count, 0);
  const totalAllocated = myStrategies.reduce((acc, s) => acc + s.allocated_amount_usd, 0);
  const totalCreatorInvestment = myStrategies.reduce((acc, s) => acc + s.creator_investment, 0);
  const newFollowersThisMonth = 574;

  const lastMonthEarnings = mockEarningsHistory[mockEarningsHistory.length - 2]?.earnings || 0;
  const currentEarnings = mockEarningsHistory[mockEarningsHistory.length - 1]?.earnings || 0;
  const growthRate = lastMonthEarnings > 0 ? ((currentEarnings - lastMonthEarnings) / lastMonthEarnings) : 0;
  const projectedNextMonth = Math.round(currentEarnings * (1 + growthRate * 0.5));

  const validatedCount = myStrategies.filter(s => s.status === 'validated_listed').length;
  const privateCount = myStrategies.filter(s => s.status === 'private').length;

  const strategiesWithPending = getStrategiesWithPendingUpdates();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">Manage your portfolios and track your earnings.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild><Link to="/simulation/new"><Play className="h-4 w-4 mr-2" />Run Simulation</Link></Button>
            <Button asChild className="glow-primary"><Link to="/create"><Plus className="h-4 w-4 mr-2" />Create New</Link></Button>
          </div>
        </div>

        {/* Pending Updates Panel */}
        {strategiesWithPending.length > 0 && (
          <div className="mb-8">
            <PendingUpdatesPanel strategies={strategiesWithPending} />
          </div>
        )}

        {/* Stats Overview */}
        <TooltipProvider delayDuration={200}>
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Total Portfolios</p>
                    </div>
                    <p className="text-3xl font-bold">{myStrategies.length}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="text-success">{validatedCount} listed</span>
                      {privateCount > 0 && <span>• {privateCount} private</span>}
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                The number of portfolios you've created — listed ones are publicly available
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Total Followers</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold">{totalFollowers.toLocaleString()}</p>
                      <span className="text-xs text-success flex items-center"><ArrowUpRight className="h-3 w-3" />+{newFollowersThisMonth}</span>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                People who have allocated money to your portfolios
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Total Allocated</p>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totalAllocated)}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Total money from all investors across all your portfolios
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card bg-primary/5 border-primary/30 cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">Est. Monthly Earnings</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">${mockEarnings.last30Days.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Your projected earnings from portfolio fees this month
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <p className="text-sm text-muted-foreground">Creator Rank</p>
                    </div>
                    <p className="text-3xl font-bold">#{creatorRank} <span className="text-sm font-normal text-muted-foreground">of {totalCreators}</span></p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Your ranking among all creators based on total followers and performance
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Skin in the Game */}
        <Card className="glass-card mb-8 bg-success/5 border-success/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Your Total Investment (Skin in the Game)</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalCreatorInvestment)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs text-right">Every portfolio you publish has your own capital invested, building trust with followers.</p>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Earnings Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockEarningsHistory}>
                    <defs><linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']} />
                    <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#earningsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Follower Growth</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockInvestorGrowth}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [value.toLocaleString(), 'Followers']} />
                    <Line type="monotone" dataKey="investors" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Portfolios</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Switch id="validated-filter" checked={showOnlyValidated} onCheckedChange={setShowOnlyValidated} />
              <Label htmlFor="validated-filter" className="text-sm text-muted-foreground cursor-pointer">Listed only</Label>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Earnings/mo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStrategies.map((strategy) => (
                  <TableRow key={strategy.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedStrategy(strategy)}>
                    <TableCell>
                      <Link to={`/strategy/${strategy.id}`} className="font-medium hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          {strategy.strategy_type === 'GenAI' ? <Sparkles className="h-4 w-4 text-primary" /> : <Wrench className="h-4 w-4 text-muted-foreground" />}
                          {strategy.name}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded text-xs", strategy.status === 'validated_listed' ? "bg-success/20 text-success" : strategy.status === 'inactive' ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground")}>
                        {strategy.status === 'validated_listed' ? 'Listed' : strategy.status === 'inactive' ? 'Inactive' : 'Private'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{strategy.followers_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", (strategy.allocated_amount_usd / strategy.capacity_limit_usd) > 0.9 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min((strategy.allocated_amount_usd / strategy.capacity_limit_usd) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round((strategy.allocated_amount_usd / strategy.capacity_limit_usd) * 100)}%</span>
                        {strategy.new_allocations_paused && <Pause className="h-3 w-3 text-warning" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-primary font-medium">${strategy.creator_est_monthly_earnings_usd.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Portfolio Controls */}
        {selectedStrategy && selectedStrategy.status !== 'inactive' && (
          <Card className="glass-card">
            <CardHeader><CardTitle>Portfolio Controls: {selectedStrategy.name}</CardTitle></CardHeader>
            <CardContent><StrategyControls strategy={selectedStrategy} /></CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
