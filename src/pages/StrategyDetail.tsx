import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, User, DollarSign, TrendingUp, TrendingDown, Calendar, Sparkles, Wrench, Heart, MessageSquare, AlertTriangle, Clock, Lock, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageLayout } from '@/components/layout/PageLayout';

import { PerformanceChart } from '@/components/PerformanceChart';
import { StrategyActivityLog } from '@/components/StrategyActivityLog';
import { StrategyRiskProfile } from '@/components/StrategyRiskProfile';
import { ExposureBreakdown } from '@/components/ExposureBreakdown';
import { mockStrategies, mockComments, formatCurrency, formatPercent } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMockAuth } from '@/contexts/MockAuthContext';

export default function StrategyDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { userPlan, selectPlan, user } = useMockAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isProUser = userPlan === 'pro';
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [acknowledgeTerms, setAcknowledgeTerms] = useState(false);

  const strategy = mockStrategies.find(s => s.id === id);

  if (!strategy) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio not found</h1>
          <Button asChild>
            <Link to="/explore">Back to Marketplace</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Check if viewing user is the portfolio owner
  // In the mock system, we compare the user's username to the creator_id
  const isOwner = user?.username === strategy.creator_id;
  const isPrivate = strategy.status === 'private';

  // Inactive/liquidated strategy
  if (strategy.status === 'inactive') {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This portfolio has been liquidated</h1>
          <p className="text-muted-foreground mb-6">The creator has deactivated this portfolio and all followers have been exited.</p>
          <Button asChild>
            <Link to="/explore">Back to Marketplace</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isValidated = strategy.validation_status === 'validated' && strategy.validation_criteria_met;
  const isPaused = strategy.new_allocations_paused;
  const hasPendingUpdate = strategy.pending_update !== undefined;

  const handleAllocate = () => {
    setShowAllocateModal(false);
    setAcknowledgeTerms(false);
    toast({
      title: "Allocation confirmed (prototype)",
      description: "In a live product, funds would be routed through a brokerage partner.",
    });
  };

  const alphaFeePct = strategy.creator_fee_pct; // 0.25% from portfolio data
  const platformFeePct = 0.0025; // 0.25% platform fee
  const totalFeePct = alphaFeePct + platformFeePct;
  const amount = parseFloat(allocateAmount || '0');
  const totalFee = amount * totalFeePct;
  const alphaShare = amount * alphaFeePct;
  const platformFee = amount * platformFeePct;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/explore">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>

          {/* Pending Update Banner */}
          {hasPendingUpdate && (
            <Card className="mb-6 border-warning/50 bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-warning-foreground">
                      Update pending: {strategy.pending_update} requires your approval
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{strategy.pending_change_summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{strategy.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5 font-mono">
                  <User className="w-4 h-4" />
                  {strategy.creator_id}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {new Date(strategy.created_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isValidated && !isPaused ? (
                <Button onClick={() => setShowAllocateModal(true)} className="glow-primary">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Allocate to Portfolio
                </Button>
              ) : isPaused ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button disabled className="opacity-50 cursor-not-allowed">
                        <Clock className="h-4 w-4 mr-2" />
                        Capacity Reached
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      New allocations are paused due to capacity limits.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button disabled className="opacity-50 cursor-not-allowed">
                        <Clock className="h-4 w-4 mr-2" />
                        In Validation
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      This portfolio must complete validation before it can accept allocations.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="glass-card cursor-help">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">30d Return</p>
                      <p className={cn("text-2xl font-bold flex items-center gap-1", strategy.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                        {strategy.performance.return_30d >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        {formatPercent(strategy.performance.return_30d)}
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">How much this portfolio gained or lost in the past 30 days</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="glass-card cursor-help">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Followers</p>
                      <p className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        {strategy.followers_count.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">How many people have put money into this portfolio</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="glass-card bg-success/5 border-success/30 cursor-help">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Creator Invested</p>
                      <p className="text-2xl font-bold text-success">{formatCurrency(strategy.creator_investment)}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">The creator's own money in this portfolio — shows they believe in it</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="glass-card cursor-help">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Allocated</p>
                      <p className="text-2xl font-bold">{formatCurrency(strategy.allocated_amount_usd)}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">Total money from all investors combined</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="glass-card cursor-help">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Consistency</p>
                      <p className="text-2xl font-bold">{strategy.performance.consistency_score}/100</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[220px]">How steady the returns are — higher means fewer big swings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Liquidation Warning */}
          <Card className="mb-6 border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-destructive">Important:</span> If this Alpha exits their position, your allocation will automatically mirror that exit. You may receive less than your initial investment. This does not constitute investment advice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="bg-secondary mb-6 flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="exposure">Exposure</TabsTrigger>
              <TabsTrigger value="track-record">Track Record</TabsTrigger>
              <TabsTrigger value="advanced-analytics" className="flex items-center gap-1.5">
                Advanced Analytics
                {!isProUser && <Lock className="h-3 w-3 text-muted-foreground" />}
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader><CardTitle>Portfolio Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                        {strategy.strategy_type === 'GenAI' ? <Sparkles className="h-4 w-4 text-primary" /> : <Wrench className="h-4 w-4" />}
                        {strategy.strategy_type}
                      </span>
                      <span className="px-3 py-1.5 rounded-lg bg-secondary text-sm">{strategy.objective}</span>
                      <span className="px-3 py-1.5 rounded-lg bg-secondary text-sm">{strategy.risk_level} Risk</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Portfolio Rationale</h4>
                      <p className="text-muted-foreground text-sm">{strategy.description_rationale}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Risks</h4>
                      <p className="text-muted-foreground text-sm">{strategy.risks}</p>
                    </div>
                  </CardContent>
                </Card>
                <StrategyRiskProfile strategy={strategy} />
              </div>
            </TabsContent>

            <TabsContent value="holdings">
              <Card className="glass-card">
                {!isOwner && (
                  <div className="mx-6 mt-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/30">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-violet-400">Protected Holdings</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Individual holdings are hidden to protect the Alpha's intellectual property. You can see sector allocations only.
                        </p>
                      </div>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground shrink-0 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="text-xs max-w-[240px]">
                            Individual holdings are hidden to protect the creator's intellectual property. Sector-level allocations are shown instead.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{isOwner ? 'Holdings' : 'Sector Allocation'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isOwner ? (
                          <>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Sector</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>Sector</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isOwner ? (
                        strategy.holdings.map((holding) => (
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
                          </TableRow>
                        ))
                      ) : (
                        // Group holdings by sector and sum weights for non-owners
                        Object.entries(
                          strategy.holdings.reduce<Record<string, number>>((acc, h) => {
                            const sector = h.sector || 'Other';
                            acc[sector] = (acc[sector] || 0) + h.weight;
                            return acc;
                          }, {})
                        )
                          .sort(([, a], [, b]) => b - a)
                          .map(([sector, weight]) => (
                            <TableRow key={sector}>
                              <TableCell className="font-medium">{sector}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${weight}%` }} />
                                  </div>
                                  <span className="font-medium">{Math.round(weight)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exposure">
              <ExposureBreakdown 
                exposure={strategy.exposure_breakdown} 
                topThemes={strategy.top_themes} 
                disclosureText={strategy.disclosure_text_public}
                sectors={strategy.sectors}
                geoFocus={strategy.geo_focus}
                allowedAssets={strategy.allowed_assets}
                lastRebalanced={strategy.last_rebalanced_date}
              />
            </TabsContent>

            <TabsContent value="track-record">
              <PerformanceChart return30d={strategy.performance.return_30d} return90d={strategy.performance.return_90d} portfolioName={strategy.name} />
            </TabsContent>

            <TabsContent value="advanced-analytics">
              {isProUser ? (
                <div className="space-y-6">
                  <Card className="glass-card">
                    <CardHeader><CardTitle>Stress Testing</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Simulated performance under historical crisis scenarios.</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        {[
                          { scenario: '2008 Financial Crisis', impact: '-32.4%', recovery: '14 months' },
                          { scenario: 'COVID-19 Crash (2020)', impact: '-18.7%', recovery: '5 months' },
                          { scenario: 'Rate Hike Cycle (2022)', impact: '-12.1%', recovery: '8 months' },
                        ].map((test) => (
                          <Card key={test.scenario} className="bg-secondary/50">
                            <CardContent className="p-4">
                              <p className="text-sm font-medium mb-2">{test.scenario}</p>
                              <p className="text-2xl font-bold text-destructive">{test.impact}</p>
                              <p className="text-xs text-muted-foreground mt-1">Est. recovery: {test.recovery}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardHeader><CardTitle>Volatility Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: 'Annualized Volatility', value: `${strategy.performance.volatility.toFixed(1)}%` },
                          { label: 'Sharpe Ratio', value: (strategy.performance.return_30d / Math.max(strategy.performance.volatility, 1) * 3.46).toFixed(2) },
                          { label: 'Sortino Ratio', value: (strategy.performance.return_30d / Math.max(strategy.performance.volatility * 0.7, 1) * 3.46).toFixed(2) },
                          { label: 'Beta vs S&P 500', value: (0.6 + Math.random() * 0.8).toFixed(2) },
                          { label: 'Worst Drop Duration', value: `${Math.floor(Math.random() * 30) + 5} days` },
                        ].map((metric) => (
                          <div key={metric.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm text-muted-foreground">{metric.label}</span>
                            <span className="font-medium">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Tax Reports</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => toast({ title: 'Download started (prototype)', description: 'Tax report PDF would download here.' })}>
                          Download Tax Report
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Generate and download tax-ready reports for your portfolio holdings, including realized/unrealized gains and dividend income.</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                      Pro
                    </div>
                    <h3 className="text-xl font-bold mb-2">Advanced Analytics & Tax Reports</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      Unlock stress testing, volatility breakdowns, Sharpe/Sortino ratios, and downloadable tax reports with a Pro subscription.
                    </p>
                    <Button onClick={() => setShowUpgradeModal(true)} className="glow-primary">
                      Upgrade to Pro — $49.99/mo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <StrategyActivityLog activityLog={strategy.activity_log} />
            </TabsContent>

            <TabsContent value="discussion">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Discussion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockComments.map((comment) => (
                    <div key={comment.id} className="p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" />{comment.likes}
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-sm text-muted-foreground py-4">Comments are a prototype feature.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Allocate Modal */}
          <Dialog open={showAllocateModal} onOpenChange={setShowAllocateModal}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Allocate to {strategy.name}</DialogTitle>
                <DialogDescription>You are allocating to a managed portfolio.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
                  <p>• Minor rebalances apply automatically.</p>
                  <p>• Structural changes require your approval.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Allocation Amount (USD)</Label>
                  <Input id="amount" type="number" placeholder="10000" value={allocateAmount} onChange={(e) => setAllocateAmount(e.target.value)} />
                </div>
                {allocateAmount && parseFloat(allocateAmount) > 0 && (
                   <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
                     <p className="text-muted-foreground">Alpha fee: ${alphaShare.toFixed(2)} ({(alphaFeePct * 100).toFixed(2)}% AUM)</p>
                     <p className="text-muted-foreground">Platform fee: ${platformFee.toFixed(2)} ({(platformFeePct * 100).toFixed(2)}% AUM)</p>
                     <p className="font-medium">Total: ${totalFee.toFixed(2)} ({(totalFeePct * 100).toFixed(2)}% annually)</p>
                   </div>
                )}
                <div className="flex items-start gap-2">
                  <Checkbox id="acknowledge" checked={acknowledgeTerms} onCheckedChange={(checked) => setAcknowledgeTerms(checked === true)} />
                  <Label htmlFor="acknowledge" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    I understand portfolio changes may occur and major changes require opt-in.
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAllocateModal(false)}>Cancel</Button>
                <Button onClick={handleAllocate} disabled={!allocateAmount || parseFloat(allocateAmount) <= 0 || !acknowledgeTerms}>Confirm Allocation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Upgrade to Pro Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Get access to advanced risk analytics, stress testing, and downloadable tax reports.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold text-lg">Pro Plan</h3>
                <div>
                  <span className="text-2xl font-bold">$49.99</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✓ Everything in Basic</li>
                <li className="flex items-center gap-2">✓ Advanced risk analytics (volatility, stress testing, correlation)</li>
                <li className="flex items-center gap-2">✓ Priority marketplace access</li>
                <li className="flex items-center gap-2">✓ Downloadable tax reports</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
            <Button onClick={() => {
              selectPlan('pro');
              setShowUpgradeModal(false);
              toast({ title: 'Upgraded to Pro!', description: 'You now have access to all Pro features.' });
            }}>
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
