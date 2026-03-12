import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Target, Share2, Lock, CheckCircle2, Clock, Loader2, AlertTriangle, DollarSign, Play, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { MetricCard } from '@/components/MetricCard';
import { ValidationBadge } from '@/components/ValidationBadge';
import { formatPercent } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Area } from 'recharts';
import type { ValidationStatus } from '@/lib/types';
import { useMockAuth } from '@/contexts/MockAuthContext';

// Mock simulation data
const simulatedPortfolio = {
  name: 'Harborline Growth',
  performance: {
    return_30d: 4.2,
    return_90d: 12.8,
    max_drawdown: -8.5,
    volatility: 15.2,
    consistency_score: 78,
  }
};

type ValidationState = 'pending' | 'submitting' | 'in_progress' | 'validated';
type SimulationState = 'running' | 'stopped';

const FREE_TRIAL_DAYS = 7;

function formatElapsed(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatCountdown(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function Simulation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trialStartDate } = useMockAuth();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('pending');
  const [simulationState, setSimulationState] = useState<SimulationState>('running');
  const [chartData, setChartData] = useState<Array<{ time: string; Portfolio: number; 'S&P 500': number; 'Dow Jones': number }>>([]);

  // Compute elapsed from trialStartDate (real time elapsed since signup)
  const [now, setNow] = useState(Date.now());
  const effectiveTrialStart = trialStartDate ?? Date.now();
  const elapsedSeconds = Math.floor((now - effectiveTrialStart) / 1000);
  const trialSecondsRemaining = FREE_TRIAL_DAYS * 86400 - elapsedSeconds;

  // Tick clock every second for elapsed/countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTime = useMemo(() => new Date(effectiveTrialStart), [effectiveTrialStart]);

  // Live chart data generation
  useEffect(() => {
    if (simulationState !== 'running') return;

    // Initial data point
    if (chartData.length === 0) {
      setChartData([{ time: '0s', Portfolio: 100000, 'S&P 500': 100000, 'Dow Jones': 100000 }]);
    }

    const interval = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1];
        const portfolioDelta = last.Portfolio * ((Math.random() - 0.47) * 0.003);
        const sp500Delta = last['S&P 500'] * ((Math.random() - 0.48) * 0.002);
        const dowDelta = last['Dow Jones'] * ((Math.random() - 0.48) * 0.0018);
        const elapsed = prev.length;
        const timeLabel = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m${elapsed % 60}s`;

        return [...prev, {
          time: timeLabel,
          Portfolio: Math.round(last.Portfolio + portfolioDelta),
          'S&P 500': Math.round(last['S&P 500'] + sp500Delta),
          'Dow Jones': Math.round(last['Dow Jones'] + dowDelta),
        }].slice(-120); // Keep last 120 points
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationState, chartData.length]);

  // Calculate live metrics from chart data
  const currentPortfolioValue = chartData.length > 0 ? chartData[chartData.length - 1].Portfolio : 100000;
  const liveReturn = ((currentPortfolioValue - 100000) / 100000) * 100;
  const currentSP500 = chartData.length > 0 ? chartData[chartData.length - 1]['S&P 500'] : 100000;
  const sp500Return = ((currentSP500 - 100000) / 100000) * 100;

  // Track max drawdown
  const maxValue = chartData.reduce((max, d) => Math.max(max, d.Portfolio), 100000);
  const liveDrawdown = ((currentPortfolioValue - maxValue) / maxValue) * 100;

  const handleStopSimulation = () => {
    setSimulationState('stopped');
    toast({ title: 'Simulation paused', description: 'You can invest or resume at any time.' });
  };

  const handleInvestNow = () => {
    toast({ title: 'Invest Now (prototype)', description: 'In a live product, this would take you to fund your portfolio.' });
  };

  const handleSubmitForValidation = async () => {
    setValidationState('submitting');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setValidationState('in_progress');
    await new Promise(resolve => setTimeout(resolve, 3000));
    setValidationState('validated');
    toast({ title: 'Validation complete!', description: 'Your portfolio has passed validation and can now be published.' });
  };

  const handlePublish = () => {
    setShowPublishModal(false);
    toast({ title: 'Portfolio published!', description: 'Your portfolio is now visible in the marketplace.' });
    navigate('/dashboard');
  };

  const handleKeepPrivate = () => {
    toast({ title: 'Portfolio saved privately', description: 'Only you can see this portfolio.' });
    navigate('/dashboard');
  };

  const { performance } = simulatedPortfolio;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{simulatedPortfolio.name}</h1>
              <ValidationBadge status={validationState === 'validated' ? 'validated' : 'simulated'} />
            </div>
          </div>
        </div>

        {/* Live Simulation Banner */}
        <Card className={cn(
          "mb-6 border",
          simulationState === 'running' ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
        )}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-[10px] h-[10px] rounded-full",
                  simulationState === 'running' ? "bg-success live-pulse" : "bg-warning"
                )} />
                <div>
                  <p className="font-semibold">
                    {simulationState === 'running' ? 'Live Simulation' : 'Simulation Paused'}
                    {' — '}
                    <span className="text-muted-foreground font-normal">
                      started {startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Elapsed: {formatElapsed(elapsedSeconds)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Free trial: {formatCountdown(Math.max(0, trialSecondsRemaining))} remaining
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {simulationState === 'running' ? (
                  <Button variant="outline" size="sm" onClick={handleStopSimulation}>
                    <Square className="h-3 w-3 mr-1.5" />
                    Stop
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setSimulationState('running')}>
                    <Play className="h-3 w-3 mr-1.5" />
                    Resume
                  </Button>
                )}
                <Button size="sm" className="bg-success hover:bg-success/90" onClick={handleInvestNow}>
                  <DollarSign className="h-3 w-3 mr-1.5" />
                  Invest Now
                </Button>
              </div>
            </div>
            {trialSecondsRemaining <= 86400 && trialSecondsRemaining > 0 && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Your free trial ends soon. Subscribe to continue simulating.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Live Performance Chart */}
        <Card className="glass-card mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="simPortfolioFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="simSP500Fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Portfolio" fill="url(#simPortfolioFill)" stroke="none" isAnimationActive={false} />
                  <Area type="monotone" dataKey="S&P 500" fill="url(#simSP500Fill)" stroke="none" isAnimationActive={false} />
                  <Line type="monotone" dataKey="Portfolio" stroke="#7C3AED" strokeWidth={2.5} dot={false} isAnimationActive={false} style={{ filter: 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.4))' }} />
                  <Line type="monotone" dataKey="S&P 500" stroke="#10B981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" isAnimationActive={false} />
                  <Line type="monotone" dataKey="Dow Jones" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label="Portfolio Value"
            value={`$${currentPortfolioValue.toLocaleString()}`}
            icon={<DollarSign className="h-4 w-4" />}
            tooltip="Current simulated portfolio value"
          />
          <MetricCard
            label="Total Return"
            value={formatPercent(liveReturn)}
            icon={liveReturn >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            trend={liveReturn >= 0 ? 'up' : 'down'}
            tooltip="Simulated portfolio return since start"
          />
          <MetricCard
            label="Worst Drop"
            value={formatPercent(liveDrawdown, false)}
            icon={<AlertTriangle className="h-4 w-4" />}
            trend="down"
            tooltip="Largest peak-to-trough decline during simulation"
          />
          <MetricCard
            label="Sharpe Ratio"
            value={(liveReturn / Math.max(Math.abs(liveDrawdown) * 2 || 1, 0.01)).toFixed(2)}
            icon={<BarChart3 className="h-4 w-4" />}
            tooltip="Risk-adjusted return — higher is better (return divided by volatility)"
          />
          <MetricCard
            label="vs S&P 500"
            value={`${(liveReturn - sp500Return) >= 0 ? '+' : ''}${(liveReturn - sp500Return).toFixed(2)}%`}
            icon={<BarChart3 className="h-4 w-4" />}
            trend={(liveReturn - sp500Return) >= 0 ? 'up' : 'down'}
            tooltip="Your simulated return compared to S&P 500"
          />
        </div>

        {/* Validation Section */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Validation & Publishing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationState === 'pending' && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="font-medium">Ready for validation</p>
                  <p className="text-sm text-muted-foreground">Submit your simulation results for validation to publish to the marketplace.</p>
                </div>
                <Button onClick={handleSubmitForValidation}>
                  Submit for Validation
                </Button>
              </div>
            )}
            {validationState === 'submitting' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <p className="text-sm">Submitting for validation...</p>
              </div>
            )}
            {validationState === 'in_progress' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/5 border border-warning/20">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Validation in progress</p>
                  <p className="text-sm text-muted-foreground">Analyzing performance consistency and risk metrics...</p>
                </div>
              </div>
            )}
            {validationState === 'validated' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-success">Validated</p>
                    <p className="text-sm text-muted-foreground">Your portfolio is eligible for the marketplace.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowPublishModal(true)} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Publish to Marketplace
                  </Button>
                  <Button variant="outline" onClick={handleKeepPrivate} className="flex-1">
                    <Lock className="h-4 w-4 mr-2" />
                    Keep Private
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          Alpha Trader is not a registered investment adviser. This platform is for informational and educational purposes only. Past performance does not guarantee future results.
        </p>
      </div>

      {/* Publish Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Publish to Marketplace?</DialogTitle>
            <DialogDescription>
              Your portfolio will be visible to all users. Followers will mirror your trades automatically. If you exit your position, all followers will be automatically exited as well.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPublishModal(false)}>Cancel</Button>
            <Button onClick={handlePublish}>Confirm & Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
