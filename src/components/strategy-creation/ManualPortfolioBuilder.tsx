import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, X, Plus, DollarSign, ArrowRight, Search, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GemDot } from '@/components/GemDot';
import { cn } from '@/lib/utils';
import { generateStrategyNumber } from '@/lib/strategyProfile';
import type { RiskLevel } from '@/lib/types';
import { createPortfolio } from '@/lib/supabasePortfolioService';

// Ticker universe from mock data holdings
const TICKER_UNIVERSE = [
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'Broad Market' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', sector: 'Technology' },
  { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', sector: 'International' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', sector: 'Bonds' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', sector: 'Commodities' },
  { ticker: 'ARKK', name: 'ARK Innovation ETF', sector: 'Innovation' },
  { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', sector: 'Dividend' },
  { ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF', sector: 'Dividend' },
  { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', sector: 'Income' },
  { ticker: 'TIP', name: 'iShares TIPS Bond ETF', sector: 'Inflation Protected' },
  { ticker: 'VTIP', name: 'Vanguard Short-Term Inflation-Protected Securities ETF', sector: 'Inflation Protected' },
  { ticker: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', sector: 'Bonds' },
  { ticker: 'EEM', name: 'iShares MSCI Emerging Markets ETF', sector: 'Emerging Markets' },
  { ticker: 'BNDX', name: 'Vanguard Total Intl Bond ETF', sector: 'Intl Bonds' },
  { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', sector: 'Long Bonds' },
  { ticker: 'XLV', name: 'Health Care Select Sector SPDR', sector: 'Healthcare' },
  { ticker: 'IBB', name: 'iShares Biotechnology ETF', sector: 'Biotech' },
  { ticker: 'ARKG', name: 'ARK Genomic Revolution ETF', sector: 'Genomics' },
  { ticker: 'IHI', name: 'iShares Medical Devices ETF', sector: 'Med Devices' },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR', sector: 'Technology' },
  { ticker: 'SMH', name: 'VanEck Semiconductor ETF', sector: 'Semiconductors' },
  { ticker: 'SOXX', name: 'iShares Semiconductor ETF', sector: 'Semiconductors' },
  { ticker: 'ICLN', name: 'iShares Global Clean Energy ETF', sector: 'Clean Energy' },
  { ticker: 'TAN', name: 'Invesco Solar ETF', sector: 'Solar' },
  { ticker: 'LIT', name: 'Global X Lithium & Battery Tech ETF', sector: 'Batteries' },
  { ticker: 'VTV', name: 'Vanguard Value ETF', sector: 'Value' },
  { ticker: 'VBR', name: 'Vanguard Small-Cap Value ETF', sector: 'Small Value' },
  { ticker: 'EFV', name: 'iShares MSCI EAFE Value ETF', sector: 'Intl Value' },
  { ticker: 'MTUM', name: 'iShares MSCI USA Momentum Factor ETF', sector: 'Momentum' },
  { ticker: 'XLY', name: 'Consumer Discretionary Select SPDR', sector: 'Consumer' },
  { ticker: 'O', name: 'Realty Income Corporation', sector: 'REITs' },
  { ticker: 'QCLN', name: 'First Trust NASDAQ Clean Edge ETF', sector: 'Clean Tech' },
  { ticker: 'VOOV', name: 'Vanguard S&P 500 Value ETF', sector: 'Large Value' },
];

interface ManualHolding {
  id: string;
  ticker: string;
  name: string;
  weight: number;
  sector: string;
}

const riskOptions: { level: RiskLevel; label: string; gem: string; description: string }[] = [
  { level: 'Low', label: 'Conservative', gem: 'Pearl', description: 'Low risk, capital preservation' },
  { level: 'Medium', label: 'Moderate', gem: 'Sapphire', description: 'Balanced growth and stability' },
  { level: 'High', label: 'Aggressive', gem: 'Ruby', description: 'High growth, higher volatility' },
];

interface ManualPortfolioBuilderProps {
  onOrbColorChange?: (color: string | null) => void;
}

export function ManualPortfolioBuilder({ onOrbColorChange }: ManualPortfolioBuilderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [holdings, setHoldings] = useState<ManualHolding[]>([]);
  const [rebalanceMode, setRebalanceMode] = useState<'auto' | 'approval'>('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTickerSearch, setShowTickerSearch] = useState(false);
  const [holdingToRemove, setHoldingToRemove] = useState<ManualHolding | null>(null);

  const gemPrefix = riskLevel === 'Low' ? 'Pearl' : riskLevel === 'High' ? 'Ruby' : 'Sapphire';

  const generateName = useCallback((level: RiskLevel) => {
    const prefix = level === 'Low' ? 'Pearl' : level === 'High' ? 'Ruby' : 'Sapphire';
    const num = generateStrategyNumber(level);
    return `${prefix}-${num}`;
  }, []);

  const handleSelectRisk = (level: RiskLevel) => {
    setRiskLevel(level);
    setPortfolioName(generateName(level));
    // Notify parent of orb color
    const orbColors: Record<RiskLevel, string> = {
      Low: 'rgba(226,232,240,0.08)',
      Medium: 'rgba(59,130,246,0.08)',
      High: 'rgba(225,29,72,0.08)',
    };
    onOrbColorChange?.(orbColors[level]);
  };

  const handleRegenerateName = () => {
    if (riskLevel) setPortfolioName(generateName(riskLevel));
  };

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  const isValid = riskLevel !== null && holdings.length >= 1 && totalWeight === 100;

  const filteredTickers = useMemo(() => {
    const usedTickers = new Set(holdings.map(h => h.ticker));
    return TICKER_UNIVERSE.filter(
      t => !usedTickers.has(t.ticker) &&
        (t.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, holdings]);

  const addTicker = (ticker: typeof TICKER_UNIVERSE[0]) => {
    setHoldings(prev => [...prev, {
      id: Date.now().toString(),
      ticker: ticker.ticker,
      name: ticker.name,
      weight: 0,
      sector: ticker.sector,
    }]);
    setSearchQuery('');
    setShowTickerSearch(false);
  };

  const removeHolding = (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  };

  const updateWeight = (id: string, weight: number) => {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, weight: Math.min(100, Math.max(0, weight)) } : h));
  };

  const persistAndNavigate = async (status: 'live' | 'simulating') => {
    const fallbackId = portfolioName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    let savedId = fallbackId;
    try {
      savedId = await createPortfolio({
        name: portfolioName,
        strategyType: 'Manual',
        objective: 'Growth',
        riskLevel: riskLevel,
        status: 'private',
        holdings: holdings.map(h => ({ ticker: h.ticker, name: h.name, weight: h.weight, sector: h.sector })),
        sectors: [...new Set(holdings.map(h => h.sector).filter(Boolean) as string[])],
      });
    } catch (err) {
      console.error('Supabase save failed, falling back to localStorage:', err);
    }

    // Also save to localStorage as fallback
    const newPortfolio = {
      id: savedId,
      name: portfolioName,
      creator_id: 'self',
      status,
      risk_level: riskLevel,
      strategy_type: 'Manual',
      objective: 'Growth',
      performance: { return_30d: 0, max_drawdown: 0, consistency_score: 50 },
      followers: 0,
      allocated: 0,
      creator_investment: 0,
      holdings: holdings.map(h => ({ ticker: h.ticker, name: h.name, weight: h.weight, sector: h.sector })),
      created_date: new Date().toISOString(),
      rebalance_mode: rebalanceMode,
    };
    const existing = JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]');
    existing.push(newPortfolio);
    localStorage.setItem('userCreatedPortfolios', JSON.stringify(existing));

    if (status === 'live') {
      toast({ title: 'Portfolio created!', description: 'Redirecting to your dashboard...' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      navigate(`/simulation/${savedId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Risk Level Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Risk Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {riskOptions.map(({ level, label, gem, description }) => (
              <button
                key={level}
                onClick={() => handleSelectRisk(level)}
                className={cn(
                  'rounded-xl p-4 text-left transition-all duration-200 border cursor-pointer',
                  riskLevel === level
                    ? 'border-primary shadow-[0_0_16px_rgba(124,58,237,0.15)]'
                    : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                )}
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <GemDot name={`${gem}-100`} size={24} showTooltip={false} />
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Name (shown after risk selected) */}
      {riskLevel && (
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GemDot name={portfolioName} size={28} showTooltip={false} />
                <div>
                  <Label className="text-xs text-muted-foreground">Portfolio Name</Label>
                  <p className="text-xl font-bold" style={{
                    color: riskLevel === 'Low' ? '#E2E8F0' : riskLevel === 'High' ? '#E11D48' : '#3B82F6',
                  }}>
                    {portfolioName}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRegenerateName} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holdings */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Holdings</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTickerSearch(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Holding
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ticker Search Dropdown */}
          {showTickerSearch && (
            <div className="rounded-xl border border-border/50 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ticker or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 border-b border-border/30 rounded-none focus-visible:ring-0"
                  autoFocus
                />
                <button
                  onClick={() => { setShowTickerSearch(false); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredTickers.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground text-center">No matching tickers</p>
                ) : (
                  filteredTickers.slice(0, 10).map(t => (
                    <button
                      key={t.ticker}
                      onClick={() => addTicker(t)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{t.ticker}</span>
                        <span className="text-muted-foreground ml-2">{t.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{t.sector}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Holdings List */}
          {holdings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">Add your first holding to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {holdings.map(h => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{h.ticker}</span>
                    <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      required
                      value={h.weight || ''}
                      onChange={e => updateWeight(h.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right bg-secondary h-8"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setHoldingToRemove(h)}
                      aria-label={`Remove ${h.ticker}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {holdings.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span
                  className={cn(
                    'font-mono font-bold text-lg tabular-nums',
                    totalWeight === 100 ? 'text-success' : 'text-warning',
                  )}
                >
                  {totalWeight.toFixed(1)} / 100%
                </span>
              </div>
              {totalWeight !== 100 && (
                <p className="text-sm text-warning animate-in fade-in duration-200">
                  Allocations total {totalWeight.toFixed(1)}% — adjust weights so the sum equals 100%.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rebalancing Preference */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Rebalancing Preference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'auto' as const, label: 'Auto-apply' },
              { value: 'approval' as const, label: 'Require approval' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setRebalanceMode(opt.value)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-medium transition-all border cursor-pointer',
                  rebalanceMode === opt.value
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-[rgba(255,255,255,0.06)] text-muted-foreground hover:border-[rgba(255,255,255,0.12)]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-apply will automatically rebalance when the Alpha adjusts. Require approval sends you a notification to review changes first.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={() => persistAndNavigate('live')}
            className="flex-1 h-12 text-base font-semibold glow-primary"
            disabled={!isValid}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Invest Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => persistAndNavigate('simulating')}
            className="flex-1 h-12 text-base"
            disabled={!isValid}
          >
            Simulate First
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Simulation is optional. You can invest directly or test with live data first.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Platform fee: 0.25% annually on invested capital
        </p>
      </div>

      <AlertDialog open={holdingToRemove !== null} onOpenChange={(open) => !open && setHoldingToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove holding?</AlertDialogTitle>
            <AlertDialogDescription>
              {holdingToRemove
                ? `Remove ${holdingToRemove.ticker} from your portfolio?`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                if (holdingToRemove) removeHolding(holdingToRemove.id);
                setHoldingToRemove(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
