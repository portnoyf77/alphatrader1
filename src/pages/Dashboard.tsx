import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Shield, Filter, Pause, BarChart3, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from '@/components/layout/PageLayout';
import { StrategyControls } from '@/components/StrategyControls';
import { PendingUpdatesPanel } from '@/components/PendingUpdatesPanel';
import { formatCurrency, formatPercent, mockStrategies, getStrategiesWithPendingUpdates } from '@/lib/mockData';
import { cn } from '@/lib/utils';

// My portfolios (ones I created)
const myPortfolios = mockStrategies.slice(0, 4);
// Portfolios I've invested in (mock data - different portfolios)
const investedPortfolios = mockStrategies.slice(4, 7).map(p => ({
  ...p,
  myAllocation: Math.round(Math.random() * 50000) + 5000,
  myReturn: (Math.random() - 0.3) * 20,
}));

export default function Dashboard() {
  const navigate = useNavigate();
  const [showOnlyValidated, setShowOnlyValidated] = useState(false);

  const filteredMyPortfolios = showOnlyValidated 
    ? myPortfolios.filter(s => s.validation_status === 'validated' && s.validation_criteria_met && s.status === 'validated_listed')
    : myPortfolios;

  const validatedCount = myPortfolios.filter(s => s.status === 'validated_listed').length;
  const simulatingCount = myPortfolios.filter(s => s.status === 'private').length;
  const totalMyInvestment = myPortfolios.reduce((acc, s) => acc + s.creator_investment, 0);
  const totalInvestedInOthers = investedPortfolios.reduce((acc, s) => acc + s.myAllocation, 0);

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
          <div className="mb-8">
            <PendingUpdatesPanel strategies={strategiesWithPending} />
          </div>
        )}

        {/* Stats Overview */}
        <TooltipProvider delayDuration={200}>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">My Portfolios</p>
                    </div>
                    <p className="text-3xl font-bold">{myPortfolios.length}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="text-success">{validatedCount} live</span>
                      {simulatingCount > 0 && <span>• {simulatingCount} simulating</span>}
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Portfolios you've created — live ones are accepting investments
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Invested in Others</p>
                    </div>
                    <p className="text-3xl font-bold">{investedPortfolios.length}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatCurrency(totalInvestedInOthers)} allocated</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Portfolios created by others that you've invested in
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card bg-success/5 border-success/30 cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-success" />
                      <p className="text-sm text-muted-foreground">My Investment</p>
                    </div>
                    <p className="text-3xl font-bold text-success">{formatCurrency(totalMyInvestment)}</p>
                    <p className="text-xs text-muted-foreground mt-2">In my own portfolios</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Your own capital invested in portfolios you created
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Total Value</p>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totalMyInvestment + totalInvestedInOthers)}</p>
                    <p className="text-xs text-muted-foreground mt-2">All investments</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Combined value of all your investments
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Tabbed Portfolio Lists */}
        <Tabs defaultValue="my-portfolios" className="mb-8">
          <TabsList className="bg-secondary mb-6">
            <TabsTrigger value="my-portfolios">My Portfolios</TabsTrigger>
            <TabsTrigger value="invested">Invested In</TabsTrigger>
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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">My Investment</TableHead>
                      <TableHead className="text-right">30d Return</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMyPortfolios.map((portfolio) => (
                      <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/dashboard/portfolio/${portfolio.id}`)}>
                        <TableCell>
                          <Link to={`/dashboard/portfolio/${portfolio.id}`} className="font-medium hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", (portfolio.allocated_amount_usd / portfolio.capacity_limit_usd) > 0.9 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min((portfolio.allocated_amount_usd / portfolio.capacity_limit_usd) * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round((portfolio.allocated_amount_usd / portfolio.capacity_limit_usd) * 100)}%</span>
                            {portfolio.new_allocations_paused && <Pause className="h-3 w-3 text-warning" />}
                          </div>
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
                      <TableHead>Creator</TableHead>
                      <TableHead className="text-right">My Allocation</TableHead>
                      <TableHead className="text-right">My Return</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investedPortfolios.map((portfolio) => (
                      <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell>
                          <Link to={`/strategy/${portfolio.id}`} className="font-medium hover:text-primary transition-colors">
                            {portfolio.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{portfolio.creator_id}</TableCell>
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
        </Tabs>
      </div>
    </PageLayout>
  );
}
