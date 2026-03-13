import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Settings, Clock, Rocket, Users, AlertTriangle, Info, History, ChevronDown, Sparkles, PenLine, Plus, Trash2, X, ChevronUp, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/layout/PageLayout';
import { PerformanceChart } from '@/components/PerformanceChart';
import { StrategyActivityLog } from '@/components/StrategyActivityLog';
import { StrategyControls } from '@/components/StrategyControls';
import { GemDot } from '@/components/GemDot';
import { getGemHex } from '@/lib/portfolioNaming';
import { mockStrategies, formatCurrency, formatPercent } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditableHolding {
  ticker: string;
  name: string;
  weight: number;
  sector?: string;
}

export default function PortfolioOwnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showTweakModal, setShowTweakModal] = useState(false);
  const [tweakMode, setTweakMode] = useState<'choice' | 'manual'>('choice');
  const [editableHoldings, setEditableHoldings] = useState<EditableHolding[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [showMakePublicModal, setShowMakePublicModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false); // Mock state for public status

  const formatNumberWithCommas = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('en-US');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setInvestmentAmount(rawValue);
      setDisplayAmount(formatNumberWithCommas(rawValue));
    }
  };

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
  const isPublicInMarketplace = isLive && isPublic; // Only show investors if public
  
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

  const openTweakModal = () => {
    setEditableHoldings(portfolio.holdings.map(h => ({ ...h })));
    setTweakMode('choice');
    setShowTweakModal(true);
  };

  const closeTweakModal = () => {
    setShowTweakModal(false);
    setTweakMode('choice');
    setNewTicker('');
    setNewName('');
    setNewWeight('');
  };

  const handleWeightChange = (ticker: string, newWeight: string) => {
    const numericValue = newWeight.replace(/[^0-9.]/g, '');
    const weight = parseFloat(numericValue) || 0;
    setEditableHoldings(prev => 
      prev.map(h => h.ticker === ticker ? { ...h, weight: Math.min(100, Math.max(0, weight)) } : h)
    );
  };

  const handleWeightStep = (ticker: string, delta: number) => {
    setEditableHoldings(prev => 
      prev.map(h => h.ticker === ticker 
        ? { ...h, weight: Math.min(100, Math.max(0, Math.round((h.weight + delta) * 10) / 10)) } 
        : h
      )
    );
  };

  const handleRemoveHolding = (ticker: string) => {
    setEditableHoldings(prev => prev.filter(h => h.ticker !== ticker));
  };

  const handleAddHolding = () => {
    if (!newTicker.trim() || !newName.trim() || !newWeight.trim()) return;
    const weight = parseFloat(newWeight) || 0;
    if (weight <= 0 || weight > 100) return;
    if (editableHoldings.some(h => h.ticker.toUpperCase() === newTicker.toUpperCase())) {
      toast({ title: "Ticker already exists", variant: "destructive" });
      return;
    }
    setEditableHoldings(prev => [...prev, { ticker: newTicker.toUpperCase(), name: newName, weight }]);
    setNewTicker('');
    setNewName('');
    setNewWeight('');
  };

  const totalWeight = editableHoldings.reduce((sum, h) => sum + h.weight, 0);
  const weightDiff = Math.abs(totalWeight - 100);
  const isBalanced = weightDiff < 0.1;
  const isCloseEnough = weightDiff < 5; // Within 5% - show warning instead of error

  const handleBalanceWeights = () => {
    if (totalWeight === 0 || editableHoldings.length === 0) return;
    const factor = 100 / totalWeight;
    setEditableHoldings(prev => 
      prev.map(h => ({ ...h, weight: Math.round(h.weight * factor * 10) / 10 }))
    );
  };

  const handleSaveManualChanges = () => {
    // Auto-balance if close enough
    if (!isBalanced && isCloseEnough) {
      handleBalanceWeights();
    }
    toast({ 
      title: "Portfolio updated (prototype)", 
      description: isLive 
        ? "Your changes have been saved. Holdings will be rebalanced."
        : "Your changes have been saved and a new simulation has started."
    });
    closeTweakModal();
  };

  const handleMakePublic = () => {
    setIsPublic(true);
    setShowMakePublicModal(false);
    toast({
      title: "Portfolio is now public",
      description: "Your portfolio is visible in the marketplace. Followers can now allocate to it.",
    });
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
                <GemDot name={portfolio.name} size={10} />
                <h1 className="text-3xl font-bold" style={{ color: getGemHex(portfolio.name).color, textShadow: `0 0 24px ${getGemHex(portfolio.name).glow}` }}>{portfolio.name}</h1>
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
                {isSimulating && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Simulating for {simulationDays} days
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={openTweakModal}>
                <Settings className="h-4 w-4 mr-2" />
                {isSimulating ? 'Tweak & Resimulate' : 'Tweak Allocation'}
              </Button>
              {isSimulating && (
                <Button onClick={() => setShowExecuteModal(true)} className="glow-primary">
                  <Rocket className="h-4 w-4 mr-2" />
                  Execute & Go Live
                </Button>
              )}
              {isLive && !isPublic && (
                <Button onClick={() => setShowMakePublicModal(true)} className="glow-primary">
                  <Globe className="h-4 w-4 mr-2" />
                  Make Public
                </Button>
              )}
              {isPublicInMarketplace && (
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-success/10 text-success text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  Listed in Marketplace
                </span>
              )}
            </div>
          </div>


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
            {isPublicInMarketplace && (
              <>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Followers</p>
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

          {/* Performance Chart */}
          <div className="mb-8">
            <PerformanceChart 
              return30d={portfolio.performance.return_30d} 
              return90d={portfolio.performance.return_90d} 
              portfolioName={portfolio.name} 
            />
          </div>

          {/* Holdings Table */}
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
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

          {/* Controls (Live only) */}
          {isLive && (
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle>Portfolio Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <StrategyControls strategy={portfolio} />
              </CardContent>
            </Card>
          )}

          {/* Activity Log - Collapsible */}
          <Collapsible>
            <Card className="glass-card">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Activity Log
                    </CardTitle>
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <StrategyActivityLog activityLog={portfolio.activity_log} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Execute Modal */}
          <Dialog open={showExecuteModal} onOpenChange={setShowExecuteModal}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Execute Portfolio & Go Live</DialogTitle>
                <DialogDescription>
                  You're about to take your portfolio live. This will allow followers to allocate to it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="investment">Your Investment</Label>
                  <div className="relative w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      id="investment" 
                      type="text"
                      inputMode="numeric"
                      placeholder="10,000" 
                      value={displayAmount} 
                      onChange={handleAmountChange}
                      className="pl-7"
                    />
                  </div>
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

          {/* Make Public Modal */}
          <Dialog open={showMakePublicModal} onOpenChange={setShowMakePublicModal}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Make Portfolio Public</DialogTitle>
                <DialogDescription>
                  Your portfolio will be visible in the marketplace. Followers can discover and allocate to it.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <h4 className="font-medium mb-2">What happens when you go public:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your portfolio appears in the Explore marketplace</li>
                    <li>• Followers can view your performance and allocate capital</li>
                    <li>• You earn fees from follower allocations</li>
                    <li>• Your holdings remain protected (exposure-only view)</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMakePublicModal(false)}>Cancel</Button>
                <Button onClick={handleMakePublic} className="glow-primary">
                  <Globe className="h-4 w-4 mr-2" />
                  Make Public
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tweak Modal */}
          <Dialog open={showTweakModal} onOpenChange={(open) => !open && closeTweakModal()}>
            <DialogContent className="glass-card max-w-2xl max-h-[85vh] overflow-y-auto">
              {tweakMode === 'choice' ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Tweak Your Portfolio</DialogTitle>
                    <DialogDescription>
                      Choose how you'd like to modify your portfolio allocation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-6">
                    <button
                      onClick={() => navigate(`/invest?edit=${portfolio.id}`)}
                      className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <span className="font-semibold text-lg">GenAI</span>
                      <p className="text-sm text-muted-foreground text-center">
                        Describe changes in natural language and let AI optimize your allocation
                      </p>
                    </button>
                    <button
                      onClick={() => setTweakMode('manual')}
                      className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <PenLine className="h-8 w-8 text-primary" />
                      </div>
                      <span className="font-semibold text-lg">Manual</span>
                      <p className="text-sm text-muted-foreground text-center">
                        Edit weights, add or remove holdings yourself
                      </p>
                    </button>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeTweakModal}>Cancel</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setTweakMode('choice')} className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <DialogTitle>Edit Allocation</DialogTitle>
                        <DialogDescription>
                          Adjust weights, remove holdings, or add new ones. Weights must sum to 100%.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-4">
                    {/* Holdings Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-24 text-right">Weight %</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editableHoldings.map((holding) => (
                            <TableRow key={holding.ticker}>
                              <TableCell className="font-mono font-semibold">{holding.ticker}</TableCell>
                              <TableCell className="text-muted-foreground">{holding.name}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={holding.weight}
                                    onChange={(e) => handleWeightChange(holding.ticker, e.target.value)}
                                    className="w-16 text-right h-8"
                                  />
                                  <div className="flex flex-col">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleWeightStep(holding.ticker, 1)}
                                      className="h-4 w-6 rounded-b-none border-b-0"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleWeightStep(holding.ticker, -1)}
                                      className="h-4 w-6 rounded-t-none"
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveHolding(holding.ticker)}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Weight Summary */}
                    <div className={cn(
                      "flex justify-between items-center p-3 rounded-lg",
                      isBalanced 
                        ? "bg-success/10 text-success" 
                        : isCloseEnough 
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                    )}>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Total Weight</span>
                        {!isBalanced && editableHoldings.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleBalanceWeights}
                            className="h-7 text-xs"
                          >
                            Balance to 100%
                          </Button>
                        )}
                      </div>
                      <span className="font-bold">{totalWeight.toFixed(1)}%</span>
                    </div>

                    {/* Add New Holding */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <Label className="text-sm font-medium">Add New Holding</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ticker"
                          value={newTicker}
                          onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                          className="w-24"
                        />
                        <Input
                          placeholder="Name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="%"
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          className="w-20"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleAddHolding}
                          disabled={!newTicker || !newName || !newWeight}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={closeTweakModal}>Cancel</Button>
                    <Button 
                      onClick={handleSaveManualChanges}
                      disabled={!isCloseEnough || editableHoldings.length === 0}
                      className="glow-primary"
                    >
                      {isBalanced ? 'Save & Resimulate' : 'Balance & Save'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout>
  );
}
