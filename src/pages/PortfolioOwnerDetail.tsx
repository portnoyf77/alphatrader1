import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Settings, Clock, Rocket, Users, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/layout/PageLayout';
import { PerformanceChart } from '@/components/PerformanceChart';
import { StrategyActivityLog } from '@/components/StrategyActivityLog';
import { StrategyControls } from '@/components/StrategyControls';
import { mockStrategies, formatCurrency, formatPercent } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PortfolioOwnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');

  const portfolio = mockStrategies.find(s => s.id === id);

  if (!portfolio) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio not found</h1>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isSimulating = portfolio.status === 'private';
  const isLive = portfolio.status === 'validated_listed';
  
  // Calculate simulation duration (mock - days since created)
  const createdDate = new Date(portfolio.created_date);
  const today = new Date();
  const simulationDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleExecute = () => {
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) return;
    
    setShowExecuteModal(false);
    toast({
      title: "Portfolio going live (prototype)",
      description: `Your portfolio is now live with ${formatCurrency(parseFloat(investmentAmount))} invested.`,
    });
    navigate('/dashboard');
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{portfolio.name}</h1>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  isLive ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                )}>
                  {isLive ? 'Live' : 'Simulating'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {new Date(portfolio.created_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isSimulating && (
                <>
                  <Button variant="outline" asChild>
                    <Link to={`/invest?edit=${portfolio.id}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Tweak & Resimulate
                    </Link>
                  </Button>
                  <Button onClick={() => setShowExecuteModal(true)} className="glow-primary">
                    <Rocket className="h-4 w-4 mr-2" />
                    Execute & Go Live
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Simulation Status Card */}
          {isSimulating && (
            <Card className="mb-8 border-primary/50 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Simulating for</p>
                    <p className="text-2xl font-bold">{simulationDays} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {isLive && (
              <Card className="glass-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">My Investment</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(portfolio.creator_investment)}</p>
                </CardContent>
              </Card>
            )}
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">30d Return</p>
                <p className={cn("text-2xl font-bold flex items-center gap-1", portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                  {portfolio.performance.return_30d >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {formatPercent(portfolio.performance.return_30d)}
                </p>
              </CardContent>
            </Card>
            {isLive && (
              <>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Investors</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      {portfolio.followers_count.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Allocated</p>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio.allocated_amount_usd)}</p>
                  </CardContent>
                </Card>
              </>
            )}
            {isSimulating && (
              <TooltipProvider>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1 cursor-help">
                          Worst Drop
                          <Info className="h-3.5 w-3.5" />
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">
                        <p>The biggest drop from peak to bottom during the simulation. Lower is better.</p>
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-2xl font-bold text-destructive">{formatPercent(portfolio.performance.max_drawdown)}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1 cursor-help">
                          Risk Level
                          <Info className="h-3.5 w-3.5" />
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">
                        <p>How much returns swing up and down. Higher means more unpredictable performance.</p>
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-2xl font-bold">{portfolio.performance.volatility.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              </TooltipProvider>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="holdings">
            <TabsList className="bg-secondary mb-6">
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              {isLive && <TabsTrigger value="controls">Controls</TabsTrigger>}
            </TabsList>

            <TabsContent value="holdings">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Full Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                        {isLive && <TableHead className="text-right">Value</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.holdings.map((holding) => (
                        <TableRow key={holding.ticker}>
                          <TableCell className="font-mono font-semibold">{holding.ticker}</TableCell>
                          <TableCell>{holding.name}</TableCell>
                          <TableCell className="text-muted-foreground">{holding.sector || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${holding.weight}%` }} />
                              </div>
                              <span className="font-medium">{holding.weight}%</span>
                            </div>
                          </TableCell>
                          {isLive && (
                            <TableCell className="text-right font-medium">
                              {formatCurrency(portfolio.creator_investment * (holding.weight / 100))}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {isLive && (
                    <div className="mt-6 p-4 rounded-lg bg-secondary/50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Portfolio Value</span>
                        <span className="text-xl font-bold">{formatCurrency(portfolio.creator_investment)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceChart 
                return30d={portfolio.performance.return_30d} 
                return90d={portfolio.performance.return_90d} 
                portfolioName={portfolio.name} 
              />
            </TabsContent>

            <TabsContent value="activity">
              <StrategyActivityLog activityLog={portfolio.activity_log} />
            </TabsContent>

            {isLive && (
              <TabsContent value="controls">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Portfolio Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StrategyControls strategy={portfolio} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Execute Modal */}
          <Dialog open={showExecuteModal} onOpenChange={setShowExecuteModal}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Execute Portfolio & Go Live</DialogTitle>
                <DialogDescription>
                  You're about to take your portfolio live. This will allow other investors to allocate to it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="investment">Your Investment (Skin in the Game)</Label>
                  <Input 
                    id="investment" 
                    type="number" 
                    placeholder="10000" 
                    value={investmentAmount} 
                    onChange={(e) => setInvestmentAmount(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">
                    Investing your own money shows others you believe in this portfolio.
                  </p>
                </div>
                {investmentAmount && parseFloat(investmentAmount) > 0 && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                    <p className="font-medium mb-2">Summary</p>
                    <p>Your investment: <span className="font-medium">{formatCurrency(parseFloat(investmentAmount))}</span></p>
                    <p className="text-muted-foreground">Portfolio will be visible in the marketplace once live.</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExecuteModal(false)}>Cancel</Button>
                <Button 
                  onClick={handleExecute} 
                  disabled={!investmentAmount || parseFloat(investmentAmount) <= 0}
                  className="glow-primary"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Go Live
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout>
  );
}
