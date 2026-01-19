import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, User, DollarSign, TrendingUp, TrendingDown, Calendar, Sparkles, Wrench, Heart, MessageSquare, AlertTriangle, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

export default function StrategyDetail() {
  const { id } = useParams();
  const { toast } = useToast();
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

  // Non-listed strategy gating
  if (strategy.status === 'private') {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This portfolio is not publicly listed</h1>
          <p className="text-muted-foreground mb-6">Only validated portfolios appear in the marketplace.</p>
          <Button asChild>
            <Link to="/explore">Back to Marketplace</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

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

  const estimatedFee = parseFloat(allocateAmount || '0') * 0.01;
  const creatorShare = estimatedFee * (strategy.creator_fee_pct / 100);

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

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="bg-secondary mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="exposure">Exposure</TabsTrigger>
              <TabsTrigger value="track-record">Track Record</TabsTrigger>
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
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                    <p>Est. annual fee (1%): <span className="font-medium">${estimatedFee.toFixed(2)}</span></p>
                    <p className="text-muted-foreground">Creator receives: ${creatorShare.toFixed(2)} ({strategy.creator_fee_pct}%)</p>
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
    </PageLayout>
  );
}
