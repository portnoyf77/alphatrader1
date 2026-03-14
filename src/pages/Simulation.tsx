import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, AlertTriangle, DollarSign, Play, Square, Timer, Clock, Radio } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { MetricCard } from '@/components/MetricCard';
import { formatPercent, mockPortfolios } from '@/lib/mockData';
import { GemDot } from '@/components/GemDot';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Area } from 'recharts';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useLiveChartData } from '@/hooks/useLiveChartData';

type SimulationState = 'running' | 'stopped';
type TimeRange = '1D' | '1W' | '1M' | '3M' | 'All';

const FREE_TRIAL_DAYS = 7;
const SIM_ELAPSED_DAYS = 19;
const SIM_START_DATE = new Date('2026-02-22'); // 19 days before Mar 13, 2026

// Seeded random for deterministic data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate deterministic daily chart data for the full simulation period
function generateSimulationData() {
  const rand = seededRandom(872); // Ruby-872 seed
  const data: Array<{ date: Date; dateLabel: string; Portfolio: number; 'S&P 500': number; 'Dow Jones': number }> = [];
  
  let portfolio = 100000;
  let sp500 = 100000;
  let dow = 100000;

  for (let day = 0; day <= SIM_ELAPSED_DAYS; day++) {
    const date = new Date(SIM_START_DATE);
    date.setDate(date.getDate() + day);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    data.push({
      date,
      dateLabel: label,
      Portfolio: Math.round(portfolio),
      'S&P 500': Math.round(sp500),
      'Dow Jones': Math.round(dow),
    });

    // Daily returns with slight upward bias for portfolio
    portfolio *= 1 + (rand() - 0.43) * 0.025;
    sp500 *= 1 + (rand() - 0.46) * 0.018;
    dow *= 1 + (rand() - 0.46) * 0.016;
  }

  return data;
}

// Generate hourly data for the last day (1D view)
function generateIntradayData(lastDayValue: number) {
  const rand = seededRandom(1337);
  const data: Array<{ dateLabel: string; Portfolio: number; 'S&P 500': number; 'Dow Jones': number }> = [];
  
  let portfolio = lastDayValue * 0.998; // start slightly below
  let sp500 = 100000 * 1.065; // approximate SP at day 18
  let dow = 100000 * 1.055;

  for (let hour = 9; hour <= 16; hour++) {
    const label = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
    data.push({
      dateLabel: label,
      Portfolio: Math.round(portfolio),
      'S&P 500': Math.round(sp500),
      'Dow Jones': Math.round(dow),
    });
    portfolio *= 1 + (rand() - 0.45) * 0.004;
    sp500 *= 1 + (rand() - 0.48) * 0.003;
    dow *= 1 + (rand() - 0.48) * 0.0025;
  }

  return data;
}

const fullData = generateSimulationData();
const intradayData = generateIntradayData(fullData[fullData.length - 2]?.Portfolio ?? 100000);

const metricsByRange: Record<TimeRange, { value: number; return: number; worstDrop: number; sharpe: number; vsSP: number }> = {
  '1D':  { value: fullData[fullData.length - 1].Portfolio, return: 0.3, worstDrop: -0.1, sharpe: 1.55, vsSP: 0.4 },
  '1W':  { value: fullData[fullData.length - 1].Portfolio, return: 1.2, worstDrop: -0.8, sharpe: 1.82, vsSP: 0.9 },
  '1M':  { value: fullData[fullData.length - 1].Portfolio, return: 4.8, worstDrop: -2.3, sharpe: 2.15, vsSP: 1.8 },
  '3M':  { value: fullData[fullData.length - 1].Portfolio, return: 8.7, worstDrop: -5.1, sharpe: 2.45, vsSP: 2.9 },
  'All': { value: fullData[fullData.length - 1].Portfolio, return: 8.7, worstDrop: -5.1, sharpe: 2.45, vsSP: 2.9 },
};

const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', 'All'];

export default function Simulation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trialStartDate } = useMockAuth();
  const [simulationState, setSimulationState] = useState<SimulationState>('running');
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');

  const portfolio = useMemo(() => mockPortfolios.find(p => p.id === id), [id]);

  // Live chart data for 1D view
  const lastDayOpenValue = fullData[fullData.length - 2]?.Portfolio ?? 100000;
  const sp500Base = fullData[fullData.length - 2]?.['S&P 500'] ?? 106500;
  const dowBase = fullData[fullData.length - 2]?.['Dow Jones'] ?? 105500;
  const isLive1D = timeRange === '1D' && simulationState === 'running';
  const { liveData, liveMetrics, marketOpen } = useLiveChartData(isLive1D, lastDayOpenValue, sp500Base, dowBase);

  // Chart data based on time range
  const chartData = useMemo(() => {
    switch (timeRange) {
      case '1D':
        return liveData.length > 0 ? liveData : intradayData;
      case '1W':
        return fullData.slice(-7);
      case '1M':
        return fullData;
      case '3M':
        return fullData;
      case 'All':
      default:
        return fullData;
    }
  }, [timeRange, liveData]);

  // Trial countdown
  const effectiveTrialStart = trialStartDate ?? Date.now();
  const elapsedTrialSeconds = Math.floor((Date.now() - effectiveTrialStart) / 1000);
  const trialSecondsRemaining = FREE_TRIAL_DAYS * 86400 - elapsedTrialSeconds;

  // Redirect if not found or not simulating
  useEffect(() => {
    if (!portfolio) {
      navigate('/dashboard', { replace: true });
    } else if (portfolio.status !== 'private') {
      navigate(`/portfolio/${portfolio.id}`, { replace: true });
    }
  }, [portfolio, navigate]);

  if (!portfolio || portfolio.status !== 'private') {
    return null;
  }

  // Use live metrics when in 1D live mode, otherwise use static metrics
  const staticMetrics = metricsByRange[timeRange];
  const metrics = (timeRange === '1D' && liveMetrics) ? liveMetrics : staticMetrics;

  // Worst drop color coding
  const worstDropAbs = Math.abs(metrics.worstDrop);
  const worstDropColor = worstDropAbs >= 20 ? '#EF4444' : worstDropAbs >= 18 ? '#F97316' : worstDropAbs >= 15 ? '#F59E0B' : undefined;

  const handleStopSimulation = () => {
    setSimulationState('stopped');
    toast({ title: 'Simulation paused', description: 'You can invest or resume at any time.' });
  };

  const handleInvestNow = () => {
    toast({ title: 'Invest Now (prototype)', description: 'In a live product, this would take you to fund your portfolio.' });
  };

  const startDateFormatted = SIM_START_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <GemDot name={portfolio.name} size={10} />
                {portfolio.name}
              </h1>
              <span className="px-2 py-1 rounded text-xs bg-warning/20 text-warning">Simulating</span>
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
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "w-[10px] h-[10px] rounded-full cursor-help",
                        simulationState === 'running' ? "bg-success live-pulse" : "bg-warning"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {simulationState === 'running' ? 'Simulation is running — receiving live market data' : 'Simulation is paused'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div>
                  <p className="font-semibold">
                    {simulationState === 'running' ? 'Live Simulation' : 'Simulation Paused'}
                    {' — '}
                    <span className="text-muted-foreground font-normal">started {startDateFormatted}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 cursor-help">
                            <Timer className="h-3 w-3" />
                            Elapsed: {SIM_ELAPSED_DAYS} days
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Simulated days since start</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 cursor-help">
                            <Clock className="h-3 w-3" />
                            Free trial: {Math.max(0, Math.floor(trialSecondsRemaining / 86400))}d remaining
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Time remaining in your free trial</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                <Button
                  size="sm"
                  onClick={handleInvestNow}
                  className="bg-white text-[#050508] hover:bg-white/90 border-none font-bold rounded-xl"
                >
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Performance
                </CardTitle>
                {timeRange === '1D' && (
                  marketOpen && simulationState === 'running' ? (
                    <Badge className="bg-success/20 text-success border-success/30 gap-1.5 animate-fade-in">
                      <span className="w-2 h-2 rounded-full bg-success live-pulse" />
                      LIVE
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-border gap-1.5 animate-fade-in">
                      <Radio className="h-3 w-3" />
                      Market Closed
                    </Badge>
                  )
                )}
              </div>
              {/* Time Range Toggles */}
              <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer",
                      timeRange === range
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
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
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['dataMin - 2000', 'dataMax + 2000']}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Portfolio" fill="url(#simPortfolioFill)" stroke="none" isAnimationActive={isLive1D && marketOpen} animationDuration={800} />
                  <Area type="monotone" dataKey="S&P 500" fill="url(#simSP500Fill)" stroke="none" isAnimationActive={false} />
                  <Line type="monotone" dataKey="Portfolio" stroke="#7C3AED" strokeWidth={2.5} dot={false} isAnimationActive={isLive1D && marketOpen} animationDuration={800} style={{ filter: 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.4))' }} />
                  <Line type="monotone" dataKey="S&P 500" stroke="#10B981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" isAnimationActive={false} />
                  <Line type="monotone" dataKey="Dow Jones" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label="Portfolio Value"
            value={`$${metrics.value.toLocaleString()}`}
            icon={<DollarSign className="h-4 w-4" />}
            tooltip="Current simulated portfolio value"
          />
          <MetricCard
            label="Total Return"
            value={formatPercent(metrics.return)}
            icon={metrics.return >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            trend={metrics.return >= 0 ? 'up' : 'down'}
            tooltip={`Return for selected period (${timeRange})`}
          />
          <MetricCard
            label="Worst Drop"
            value={formatPercent(metrics.worstDrop, false)}
            icon={<AlertTriangle className="h-4 w-4" />}
            trend="down"
            tooltip="Largest peak-to-trough decline during selected period"
          />
          <MetricCard
            label="Sharpe Ratio"
            value={metrics.sharpe.toFixed(2)}
            icon={<BarChart3 className="h-4 w-4" />}
            tooltip="Risk-adjusted return — higher is better. Above 1.0 is considered good."
          />
          <MetricCard
            label="vs S&P 500"
            value={`${metrics.vsSP >= 0 ? '+' : ''}${metrics.vsSP.toFixed(1)}%`}
            icon={<BarChart3 className="h-4 w-4" />}
            trend={metrics.vsSP >= 0 ? 'up' : 'down'}
            tooltip="Your simulated return compared to S&P 500"
          />
        </div>
      </div>
    </PageLayout>
  );
}
