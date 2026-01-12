import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, DollarSign, TrendingUp, Users, Sparkles, Wrench, Trophy, ArrowUpRight, Share2, Shield, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/layout/PageLayout';
import { ValidationBadge } from '@/components/ValidationBadge';
import { formatCurrency, formatPercent, mockPortfolios, mockEarningsHistory, mockInvestorGrowth } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Simulate "my" portfolios - first 3 from mock data
const myPortfolios = mockPortfolios.slice(0, 3);

// Mock earnings data
const mockEarnings = {
  totalEarnings: 7580,
  last30Days: 2340,
  topPortfolio: myPortfolios[0],
};

// Calculate leaderboard position (mock)
const creatorRank = 3;
const totalCreators = 47;

export default function Dashboard() {
  const [showOnlyValidated, setShowOnlyValidated] = useState(false);

  const filteredPortfolios = showOnlyValidated 
    ? myPortfolios.filter(p => p.validation_status === 'validated' && p.validation_criteria_met)
    : myPortfolios;

  const totalInvestors = myPortfolios.reduce((acc, p) => acc + p.investors_count, 0);
  const totalAllocated = myPortfolios.reduce((acc, p) => acc + p.allocated_amount, 0);
  const totalCreatorInvestment = myPortfolios.reduce((acc, p) => acc + p.creator_investment, 0);
  const newInvestorsThisMonth = 574;

  // Calculate projected monthly earnings based on growth
  const lastMonthEarnings = mockEarningsHistory[mockEarningsHistory.length - 2]?.earnings || 0;
  const currentEarnings = mockEarningsHistory[mockEarningsHistory.length - 1]?.earnings || 0;
  const growthRate = lastMonthEarnings > 0 ? ((currentEarnings - lastMonthEarnings) / lastMonthEarnings) : 0;
  const projectedNextMonth = Math.round(currentEarnings * (1 + growthRate * 0.5)); // Conservative projection

  const validatedCount = myPortfolios.filter(p => p.validation_status === 'validated').length;
  const simulatedCount = myPortfolios.filter(p => p.validation_status === 'simulated').length;
  const inValidationCount = myPortfolios.filter(p => p.validation_status === 'in_validation').length;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your portfolios and track your earnings.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/simulation/new">
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </Link>
            </Button>
            <Button asChild className="glow-primary">
              <Link to="/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview - Enhanced */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Portfolios</p>
              <p className="text-3xl font-bold">{myPortfolios.length}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="text-success">{validatedCount} validated</span>
                {simulatedCount > 0 && <span>• {simulatedCount} simulated</span>}
                {inValidationCount > 0 && <span>• {inValidationCount} validating</span>}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Investors</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{totalInvestors.toLocaleString()}</p>
                <span className="text-xs text-success flex items-center">
                  <ArrowUpRight className="h-3 w-3" />
                  +{newInvestorsThisMonth}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Allocated</p>
              <p className="text-3xl font-bold">{formatCurrency(totalAllocated)}</p>
            </CardContent>
          </Card>
          <Card className="glass-card bg-primary/5 border-primary/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Est. Monthly Earnings</p>
              <p className="text-3xl font-bold text-primary">
                ${mockEarnings.last30Days.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Creator Rank</p>
              </div>
              <p className="text-3xl font-bold">#{creatorRank} <span className="text-sm font-normal text-muted-foreground">of {totalCreators}</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Your Investment (Skin in the Game) */}
        <Card className="glass-card mb-8 bg-success/5 border-success/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Your Total Investment (Skin in the Game)</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalCreatorInvestment)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              Every portfolio you publish has your own money invested, building trust with investors.
            </p>
          </CardContent>
        </Card>

        {/* Earnings Analytics Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Trend Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Earnings Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockEarningsHistory}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#earningsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">Projected next month</p>
                  <p className="text-lg font-semibold text-primary">${projectedNextMonth.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Growth rate</p>
                  <p className="text-lg font-semibold text-success">+{Math.round(growthRate * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investor Growth Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Investor Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockInvestorGrowth}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString(), 'Investors']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="investors" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">New this month</p>
                  <p className="text-lg font-semibold text-success">+{newInvestorsThisMonth}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Portfolios */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Portfolios</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    id="validated-filter"
                    checked={showOnlyValidated}
                    onCheckedChange={setShowOnlyValidated}
                  />
                  <Label htmlFor="validated-filter" className="text-sm text-muted-foreground cursor-pointer">
                    Validated only
                  </Label>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Validation</TableHead>
                      <TableHead className="text-right">30d Return</TableHead>
                      <TableHead className="text-right">Investors</TableHead>
                      <TableHead className="text-right">Your Investment</TableHead>
                      <TableHead className="text-right">Earnings/mo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPortfolios.map((portfolio) => (
                      <TableRow key={portfolio.id}>
                        <TableCell>
                          <Link 
                            to={`/portfolio/${portfolio.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {portfolio.strategy_type === 'GenAI' ? (
                                <Sparkles className="h-4 w-4 text-primary" />
                              ) : (
                                <Wrench className="h-4 w-4 text-muted-foreground" />
                              )}
                              {portfolio.name}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ValidationBadge status={portfolio.validation_status} showTooltip={false} />
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {formatPercent(portfolio.performance.return_30d)}
                        </TableCell>
                        <TableCell className="text-right">
                          {portfolio.investors_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {formatCurrency(portfolio.creator_investment)}
                        </TableCell>
                        <TableCell className="text-right text-primary font-medium">
                          ${portfolio.creator_est_monthly_earnings.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPortfolios.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No validated portfolios yet. Submit your strategies for validation to list them in the marketplace.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Earnings Panel - Enhanced */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Earnings Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings (All Time)</p>
                  <p className="text-3xl font-bold">${mockEarnings.totalEarnings.toLocaleString()}</p>
                </div>

                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-muted-foreground mb-1">Last 30 Days</p>
                  <p className="text-2xl font-bold text-success">
                    +${mockEarnings.last30Days.toLocaleString()}
                  </p>
                </div>

                {/* Earnings by portfolio */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Earnings by Portfolio</p>
                  <div className="space-y-2">
                    {myPortfolios.map((portfolio) => (
                      <div key={portfolio.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate max-w-[120px]">{portfolio.name}</span>
                          {portfolio.validation_status === 'validated' && (
                            <span className="w-2 h-2 rounded-full bg-success" title="Validated" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-primary">
                          ${portfolio.creator_est_monthly_earnings.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  ℹ️ You earn 20% of the 1% annual platform fee on allocated capital. Earnings are estimated based on current allocations.
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link to="/create">
                    <Plus className="h-4 w-4" />
                    Create New Portfolio
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link to="/leaderboard">
                    <Trophy className="h-4 w-4" />
                    View Leaderboard
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Your Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
