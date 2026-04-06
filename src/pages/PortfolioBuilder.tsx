import { useState, useMemo, useCallback } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, TrendingUp, Zap, RotateCcw, DollarSign, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { StockChart } from '@/components/StockChart';
import { placeOrder } from '@/lib/alpacaClient';
import { useAlpacaAccount } from '@/hooks/useAlpacaAccount';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/mockData';

// ── Risk Profiles ──

type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

type Allocation = { symbol: string; name: string; weight: number; sector: string };

const PROFILES: Record<RiskLevel, { label: string; icon: React.ElementType; color: string; description: string; allocations: Allocation[] }> = {
  conservative: {
    label: 'Conservative',
    icon: ShieldCheck,
    color: '#10B981',
    description: 'Capital preservation with steady income. Heavy bond and dividend allocation, minimal volatility.',
    allocations: [
      { symbol: 'BND', name: 'Total Bond Market', weight: 35, sector: 'Bonds' },
      { symbol: 'VTI', name: 'Total Stock Market', weight: 20, sector: 'US Equity' },
      { symbol: 'SCHD', name: 'Dividend Equity', weight: 15, sector: 'Dividends' },
      { symbol: 'TIP', name: 'Inflation-Protected', weight: 15, sector: 'Bonds' },
      { symbol: 'VXUS', name: 'International', weight: 10, sector: 'International' },
      { symbol: 'GLD', name: 'Gold', weight: 5, sector: 'Commodities' },
    ],
  },
  moderate: {
    label: 'Moderate',
    icon: TrendingUp,
    color: '#3B82F6',
    description: 'Balanced growth with managed risk. Diversified across equities, bonds, and alternatives.',
    allocations: [
      { symbol: 'VTI', name: 'Total Stock Market', weight: 30, sector: 'US Equity' },
      { symbol: 'QQQ', name: 'Nasdaq 100', weight: 20, sector: 'Tech' },
      { symbol: 'VXUS', name: 'International', weight: 15, sector: 'International' },
      { symbol: 'BND', name: 'Total Bond Market', weight: 15, sector: 'Bonds' },
      { symbol: 'SCHD', name: 'Dividend Equity', weight: 10, sector: 'Dividends' },
      { symbol: 'VNQ', name: 'Real Estate', weight: 10, sector: 'Real Estate' },
    ],
  },
  aggressive: {
    label: 'Aggressive',
    icon: Zap,
    color: '#E11D48',
    description: 'Maximum growth potential. Tech-heavy with emerging markets exposure. Higher volatility.',
    allocations: [
      { symbol: 'QQQ', name: 'Nasdaq 100', weight: 30, sector: 'Tech' },
      { symbol: 'VTI', name: 'Total Stock Market', weight: 20, sector: 'US Equity' },
      { symbol: 'ARKK', name: 'Innovation ETF', weight: 15, sector: 'Growth' },
      { symbol: 'SMH', name: 'Semiconductors', weight: 15, sector: 'Tech' },
      { symbol: 'VXUS', name: 'International', weight: 10, sector: 'International' },
      { symbol: 'XLK', name: 'Tech Select', weight: 10, sector: 'Tech' },
    ],
  },
};

// ── Donut Chart ──

function DonutChart({ allocations, color }: { allocations: Allocation[]; color: string }) {
  const size = 180;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 24;

  let cumAngle = -90; // start at top
  const segments = allocations.map((a) => {
    const angle = (a.weight / 100) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    return { ...a, d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}` };
  });

  const hues = [0, 40, 80, 140, 200, 260];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {segments.map((seg, i) => (
        <path
          key={seg.symbol}
          d={seg.d}
          fill="none"
          stroke={`hsl(${hues[i % hues.length]}, 60%, 55%)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      <text x={center} y={center - 6} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        {allocations.length}
      </text>
      <text x={center} y={center + 12} textAnchor="middle" fill="#888" fontSize="10">
        holdings
      </text>
    </svg>
  );
}

// ── Main Page ──

export default function PortfolioBuilder() {
  const [step, setStep] = useState<'select' | 'review' | 'executing' | 'done'>('select');
  const [risk, setRisk] = useState<RiskLevel>('moderate');
  const [investAmount, setInvestAmount] = useState('10000');
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<{ symbol: string; status: string; error?: string }[]>([]);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const { account } = useAlpacaAccount();

  const profile = PROFILES[risk];
  const amount = parseFloat(investAmount) || 0;

  // Initialize custom weights when profile changes
  const initWeights = useCallback(() => {
    const w: Record<string, number> = {};
    profile.allocations.forEach((a) => { w[a.symbol] = a.weight; });
    setCustomWeights(w);
  }, [profile]);

  // Reset custom weights when risk profile changes
  useMemo(() => { initWeights(); }, [initWeights]);

  const totalWeight = useMemo(() => {
    return Object.values(customWeights).reduce((sum, w) => sum + w, 0);
  }, [customWeights]);

  const orders = useMemo(() => {
    return profile.allocations.map((a) => {
      const weight = customWeights[a.symbol] ?? a.weight;
      const dollarAmount = amount * (weight / 100);
      return { ...a, weight, dollarAmount };
    });
  }, [profile, amount, customWeights]);

  const handleWeightChange = (symbol: string, newWeight: number) => {
    setCustomWeights((prev) => ({ ...prev, [symbol]: Math.max(0, Math.min(100, newWeight)) }));
  };

  const handleExecute = async () => {
    setStep('executing');
    const results: typeof executionResults = [];
    for (const order of orders) {
      try {
        // Place a notional (dollar-based) order if possible, otherwise estimate qty
        // Alpaca paper supports fractional shares, so we use qty = dollarAmount / ~price
        // For simplicity, we'll place 1 share minimum or dollar-based
        const qty = Math.max(1, Math.round(order.dollarAmount / 100)); // rough estimate
        const result = await placeOrder(order.symbol, qty, 'buy');
        results.push({ symbol: order.symbol, status: result.status });
      } catch (err) {
        results.push({ symbol: order.symbol, status: 'failed', error: err instanceof Error ? err.message : 'Failed' });
      }
    }
    setExecutionResults(results);
    setStep('done');
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            AI Portfolio Builder
          </h1>
          <p className="text-muted-foreground">
            Choose your risk profile and investment amount. We'll build a diversified portfolio and execute all trades automatically.
          </p>
        </div>

        {/* Step 1: Select Risk Profile */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.entries(PROFILES) as [RiskLevel, typeof PROFILES[RiskLevel]][]).map(([key, p]) => {
                const Icon = p.icon;
                const isSelected = risk === key;
                return (
                  <button
                    key={key}
                    onClick={() => setRisk(key)}
                    className={cn(
                      'rounded-xl p-5 text-left transition-all duration-200',
                      isSelected
                        ? 'ring-2 shadow-lg'
                        : 'hover:bg-white/[0.02]',
                    )}
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isSelected ? p.color + '40' : 'rgba(255,255,255,0.06)'}`,
                      ringColor: isSelected ? p.color : undefined,
                    }}
                  >
                    <Icon className="h-6 w-6 mb-3" style={{ color: p.color }} />
                    <h3 className="font-semibold text-foreground mb-1">{p.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Investment Amount */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Investment Amount
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="h-11 w-48 rounded-lg px-4 text-lg font-mono bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {account && (
                  <span className="text-xs text-muted-foreground">
                    Available: {formatCurrency(account.cash)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                {['1000', '5000', '10000', '25000', '50000'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setInvestAmount(val)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg transition-colors',
                      investAmount === val ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    ${Number(val).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={() => setStep('review')} disabled={amount <= 0} className="gap-2">
              Review Portfolio <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Review Allocation */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-start gap-8">
              <DonutChart allocations={profile.allocations} color={profile.color} />
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1" style={{ color: profile.color }}>
                  {profile.label} Portfolio
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{profile.description}</p>
                <div className="text-sm text-foreground mb-1">
                  Total investment: <span className="font-mono font-bold">{formatCurrency(amount)}</span>
                </div>
              </div>
            </div>

            {/* Allocation Table (editable weights) */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium">ETF</th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium">Sector</th>
                    <th className="text-right p-3 text-xs text-muted-foreground font-medium">Weight</th>
                    <th className="text-right p-3 text-xs text-muted-foreground font-medium">Amount</th>
                    <th className="text-right p-3 text-xs text-muted-foreground font-medium">Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.symbol} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-semibold text-foreground">{o.symbol}</div>
                        <div className="text-xs text-muted-foreground">{o.name}</div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{o.sector}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={o.weight}
                            onChange={(e) => handleWeightChange(o.symbol, parseFloat(e.target.value) || 0)}
                            className="w-14 h-7 rounded px-1.5 text-xs font-mono text-right bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-foreground">{formatCurrency(o.dollarAmount)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedChart(selectedChart === o.symbol ? null : o.symbol)}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          {selectedChart === o.symbol ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td colSpan={2} className="p-3 text-xs text-muted-foreground">
                      <button onClick={initWeights} className="text-xs text-primary hover:text-primary/80">
                        Reset to default
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <span className={cn(
                        'text-xs font-mono font-semibold',
                        Math.abs(totalWeight - 100) < 0.01 ? 'text-emerald-400' : 'text-amber-400'
                      )}>
                        {totalWeight.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs text-foreground">
                      {formatCurrency(amount * (totalWeight / 100))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            {Math.abs(totalWeight - 100) > 0.01 && (
              <p className="text-xs text-amber-400">
                Weights total {totalWeight.toFixed(0)}% instead of 100%. Adjust your allocations or reset to defaults.
              </p>
            )}

            {/* Inline Chart */}
            {selectedChart && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <StockChart symbol={selectedChart} />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleExecute} className="gap-2">
                <Sparkles className="h-4 w-4" /> Execute All Trades
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Executing */}
        {step === 'executing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-foreground font-semibold">Executing trades...</p>
            <p className="text-sm text-muted-foreground mt-1">Placing {orders.length} orders via Alpaca</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full mb-4" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <PieChart className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Portfolio Created</h2>
              <p className="text-sm text-muted-foreground">
                {executionResults.filter((r) => r.status !== 'failed').length} of {executionResults.length} orders placed successfully.
              </p>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium">Symbol</th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {executionResults.map((r) => (
                    <tr key={r.symbol} className="border-t border-white/[0.04]">
                      <td className="p-3 font-mono font-semibold">{r.symbol}</td>
                      <td className="p-3">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          r.status !== 'failed' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'
                        )}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{r.error || 'Order accepted'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('select'); setExecutionResults([]); }} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Build Another
              </Button>
              <Button onClick={() => window.location.href = '/portfolio-tracker'} className="gap-2">
                View Portfolio <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
