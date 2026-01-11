import { Link } from 'react-router-dom';
import { Plus, Play, Eye, EyeOff, DollarSign, TrendingUp, Users, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatPercent, mockPortfolios } from '@/lib/mockData';
import { cn } from '@/lib/utils';

// Simulate "my" portfolios - first 3 from mock data
const myPortfolios = mockPortfolios.slice(0, 3);

// Mock earnings data
const mockEarnings = {
  totalEarnings: 7580,
  last30Days: 2340,
  topPortfolio: myPortfolios[0],
};

export default function Dashboard() {
  const totalFollowers = myPortfolios.reduce((acc, p) => acc + p.followers_count, 0);
  const totalAllocated = myPortfolios.reduce((acc, p) => acc + p.allocated_amount, 0);

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

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Portfolios</p>
              <p className="text-3xl font-bold">{myPortfolios.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Followers</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-muted-foreground" />
                {totalFollowers.toLocaleString()}
              </p>
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
                      <TableHead className="text-right">Allocated</TableHead>
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
                        <TableCell className="text-right">
                          {formatCurrency(portfolio.allocated_amount)}
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

          {/* Earnings Panel */}
          <div>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold">${mockEarnings.totalEarnings.toLocaleString()}</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground mb-1">Last 30 Days</p>
                  <p className="text-2xl font-bold text-success">
                    +${mockEarnings.last30Days.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Top Earner</p>
                  <Link 
                    to={`/portfolio/${mockEarnings.topPortfolio.id}`}
                    className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <p className="font-medium">{mockEarnings.topPortfolio.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${mockEarnings.topPortfolio.creator_est_monthly_earnings.toLocaleString()}/mo
                    </p>
                  </Link>
                </div>

                <p className="text-xs text-muted-foreground">
                  ℹ️ Creator earnings are estimates based on allocated capital and platform fees (prototype).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}