import { Link } from 'react-router-dom';
import { Plus, Play, Eye, EyeOff, DollarSign, TrendingUp, Users, Sparkles, Wrench, Trophy, ArrowUpRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatPercent, mockPortfolios, mockEarningsHistory, mockFollowerGrowth } from '@/lib/mockData';
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
  const totalFollowers = myPortfolios.reduce((acc, p) => acc + p.followers_count, 0);
  const totalAllocated = myPortfolios.reduce((acc, p) => acc + p.allocated_amount, 0);
  const newFollowersThisMonth = 574;

  // Calculate projected monthly earnings based on growth
  const lastMonthEarnings = mockEarningsHistory[mockEarningsHistory.length - 2]?.earnings || 0;
  const currentEarnings = mockEarningsHistory[mockEarningsHistory.length - 1]?.earnings || 0;
  const growthRate = lastMonthEarnings > 0 ? ((currentEarnings - lastMonthEarnings) / lastMonthEarnings) : 0;
  const projectedNextMonth = Math.round(currentEarnings * (1 + growthRate * 0.5)); // Conservative projection

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
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Followers</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{totalFollowers.toLocaleString()}</p>
                <span className="text-xs text-success flex items-center">
                  <ArrowUpRight className="h-3 w-3" />
                  +{newFollowersThisMonth}
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

          {/* Follower Growth Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Follower Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockFollowerGrowth}>
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
                      formatter={(value: number) => [value.toLocaleString(), 'Followers']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="followers" 
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
                  <p className="text-lg font-semibold text-success">+{newFollowersThisMonth}</p>
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
              <CardHeader>
                <CardTitle>My Portfolios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">30d Return</TableHead>
                      <TableHead className="text-right">Followers</TableHead>
                      <TableHead className="text-right">Earnings/mo</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myPortfolios.map((portfolio) => (
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
                          <StatusBadge status={portfolio.status} />
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {formatPercent(portfolio.performance.return_30d)}
                        </TableCell>
                        <TableCell className="text-right">
                          {portfolio.followers_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-primary font-medium">
                          ${portfolio.creator_est_monthly_earnings.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/portfolio/${portfolio.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon">
                              {portfolio.status === 'Simulated' ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                        <span className="text-sm truncate max-w-[150px]">{portfolio.name}</span>
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