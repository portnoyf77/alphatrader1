import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, ArrowRight, Info, TrendingUp, Shield, Globe, Coins, AlertTriangle, DollarSign, Scale, ChevronDown, PenLine, Loader2 } from 'lucide-react';
import { generatePortfolio, executePortfolio } from '@/lib/portfolioService';
import type {
  GeneratePortfolioResponse,
  GeneratedHolding as ApiGeneratedHolding,
  OnboardingProfile,
  PortfolioRefinements,
} from '@/lib/portfolioTypes';
import { createPortfolio } from '@/lib/supabasePortfolioService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';
import {
  AiLedPortfolioCreation,
  type AiFlowResumePayload,
  type AiWizardState,
} from '@/components/strategy-creation/AiLedPortfolioCreation';
import { ParticleCrystallizationAnimation } from '@/components/strategy-creation/ParticleCrystallizationAnimation';
import { ManualPortfolioBuilder } from '@/components/strategy-creation/ManualPortfolioBuilder';
import {
  StrategyProfile,
  initialProfile,
  deriveRiskLevel,
  explainRiskScoring,
  buildStrategyProfileFromAiFlow,
} from '@/lib/strategyProfile';
import { cn } from '@/lib/utils';

interface GeneratedHolding {
  ticker: string;
  name: string;
  weight: number;
  role: 'Core' | 'Growth' | 'Stability' | 'Hedge' | 'International';
  explanation: string;
  alignment: string;
  characteristics: string[];
  tradeoff: string;
}

interface ExcludedHolding {
  ticker: string;
  name: string;
  reason: string;
}

interface EditableHolding {
  id: string;
  ticker: string;
  name: string;
  weight: number;
}

// ── Map AI holding type to a display role ──
function typeToRole(type: string): GeneratedHolding['role'] {
  const map: Record<string, GeneratedHolding['role']> = {
    'ETF': 'Core',
    'Stock': 'Growth',
    'Bond ETF': 'Stability',
    'Commodity ETF': 'Hedge',
    'REIT': 'Growth',
  };
  return map[type] || 'Core';
}

const roleColors: Record<GeneratedHolding['role'], string> = {
  Core: 'border-[rgba(148,163,184,0.3)]',
  Growth: 'border-[rgba(148,163,184,0.3)]',
  Stability: 'border-[rgba(148,163,184,0.3)]',
  Hedge: 'border-[rgba(148,163,184,0.3)]',
  International: 'border-[rgba(148,163,184,0.3)]',
};

const sectorColors = ['#94A3B8', '#64748B', '#475569', '#334155', '#1E293B'];

const roleIcons: Record<GeneratedHolding['role'], React.ReactNode> = {
  Core: <TrendingUp className="h-3 w-3" />,
  Growth: <TrendingUp className="h-3 w-3" />,
  Stability: <Shield className="h-3 w-3" />,
  Hedge: <Coins className="h-3 w-3" />,
  International: <Globe className="h-3 w-3" />,
};

/** Max holdings shown after AI generation; weights are renormalized to sum to 100%. */
const AI_RESULTS_MAX_HOLDINGS = 6;

function capHoldingsByAllocation<T extends { allocation: number }>(holdings: T[], max: number): T[] {
  const sorted = [...holdings].sort((a, b) => b.allocation - a.allocation);
  const top = sorted.slice(0, max);
  const sum = top.reduce((s, h) => s + h.allocation, 0);
  if (top.length === 0 || sum === 0) return top;
  const floors = top.map((h) => Math.floor((h.allocation / sum) * 100));
  let drift = 100 - floors.reduce((s, x) => s + x, 0);
  const allocations = [...floors];
  let i = 0;
  while (drift > 0) {
    allocations[i % allocations.length] += 1;
    drift -= 1;
    i += 1;
  }
  return top.map((h, idx) => ({ ...h, allocation: allocations[idx] }));
}

type CreationStep = 'questionnaire' | 'animation' | 'results';
type CreationTab = 'ai' | 'manual';

export default function Create() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<CreationTab>('ai');
  const [creationStep, setCreationStep] = useState<CreationStep>('questionnaire');
  const [strategyProfile, setStrategyProfile] = useState<StrategyProfile>(initialProfile);
  const [generatedStrategyName, setGeneratedStrategyName] = useState('');
  const [generatedPortfolio, setGeneratedPortfolio] = useState<{
    name: string;
    holdings: GeneratedHolding[];
    excluded: ExcludedHolding[];
    strategyBreakdown: { role: string; percentage: number }[];
    rationale: string;
    risks: string;
  } | null>(null);

  // Live prices for generated holdings
  const [holdingPrices, setHoldingPrices] = useState<Record<string, { price: number; change: number; changePercent: number }>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

  // Manual tab orb color
  const [manualOrbColor, setManualOrbColor] = useState<string | null>(null);

  const [gemAnimationProfile, setGemAnimationProfile] = useState<StrategyProfile>(initialProfile);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [usedAiLedFlow, setUsedAiLedFlow] = useState(false);
  const [aiFlowSessionKey, setAiFlowSessionKey] = useState(0);
  const [aiFlowResume, setAiFlowResume] = useState<AiFlowResumePayload | null>(null);
  const [crystallizeKey, setCrystallizeKey] = useState(0);
  const [aiStrategyMeta, setAiStrategyMeta] = useState<{
    name: string;
    description: string;
    riskLevel: string;
  } | null>(null);

  const aiFlowActiveRef = useRef(false);
  const lastCrystallizePayloadRef = useRef<{
    onboarding: OnboardingProfile;
    refinements: PortfolioRefinements;
  } | null>(null);
  const aiResumeContextRef = useRef<{
    gemProposalLevel: 'conservative' | 'moderate' | 'aggressive' | null;
    wizardState: AiWizardState | null;
  }>({ gemProposalLevel: null, wizardState: null });

  // Editable holdings state
  const [editableHoldings, setEditableHoldings] = useState<EditableHolding[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  // AI portfolio generation state
  const aiResultRef = useRef<GeneratePortfolioResponse | null>(null);
  const aiErrorRef = useRef<string | null>(null);
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [investExecuting, setInvestExecuting] = useState(false);

  // Fetch live prices when portfolio is generated
  const fetchPrices = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;
    setPricesLoading(true);
    try {
      const res = await fetch(`/api/stock-prices?symbols=${tickers.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setHoldingPrices(data);
      }
    } catch (err) {
      console.error('[Invest] Failed to fetch prices:', err);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  const startAiGeneration = useCallback(
    (onboarding: OnboardingProfile, refinements: PortfolioRefinements) => {
      aiResultRef.current = null;
      aiErrorRef.current = null;
      setAiGenerationError(null);
      generatePortfolio(onboarding, refinements)
        .then((result) => {
          aiResultRef.current = result;
        })
        .catch((err) => {
          console.error('[Invest] AI portfolio generation failed:', err);
          const msg = err instanceof Error ? err.message : 'Portfolio generation failed';
          aiErrorRef.current = msg;
          setAiGenerationError(msg);
        });
    },
    [],
  );

  const handleBeginAiCrystallization = useCallback(
    (ctx: {
      onboardingProfile: OnboardingProfile;
      refinements: PortfolioRefinements;
      gemAnimationProfile: StrategyProfile;
      gemProposalLevel: 'conservative' | 'moderate' | 'aggressive' | null;
      wizardState: AiWizardState;
    }) => {
      setStrategyProfile(buildStrategyProfileFromAiFlow(ctx.onboardingProfile, ctx.refinements));
      setGemAnimationProfile(ctx.gemAnimationProfile);
      setUsedAiLedFlow(true);
      aiFlowActiveRef.current = true;
      lastCrystallizePayloadRef.current = {
        onboarding: ctx.onboardingProfile,
        refinements: ctx.refinements,
      };
      aiResumeContextRef.current = {
        gemProposalLevel: ctx.gemProposalLevel,
        wizardState: ctx.wizardState,
      };
      setAiFlowResume(null);
      setCreationStep('animation');
      setWaitingForAI(false);
      startAiGeneration(ctx.onboardingProfile, ctx.refinements);
    },
    [startAiGeneration],
  );

  const handleRetryAiGeneration = useCallback(() => {
    const payload = lastCrystallizePayloadRef.current;
    if (!payload) return;
    setAiGenerationError(null);
    aiErrorRef.current = null;
    aiResultRef.current = null;
    setCrystallizeKey((k) => k + 1);
    startAiGeneration(payload.onboarding, payload.refinements);
  }, [startAiGeneration]);

  const handleAdjustFromAiResults = useCallback(() => {
    const payload = lastCrystallizePayloadRef.current;
    const resumeCtx = aiResumeContextRef.current;
    if (!payload) return;
    setGeneratedPortfolio(null);
    setGeneratedStrategyName('');
    setEditableHoldings([]);
    setAiStrategyMeta(null);
    setAiFlowResume({
      onboardingProfile: payload.onboarding,
      refinements: payload.refinements,
      gemProposalLevel: resumeCtx.gemProposalLevel,
      wizardState: resumeCtx.wizardState,
    });
    setAiFlowSessionKey((k) => k + 1);
    setCreationStep('questionnaire');
  }, []);

  const handleAnimationComplete = async (name: string) => {
    setGeneratedStrategyName(name);

    // If the AI call is still running, wait for it with a brief loading state
    if (!aiResultRef.current && !aiErrorRef.current) {
      setWaitingForAI(true);
      // Poll until we get a result or error (max ~30s)
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (aiResultRef.current || aiErrorRef.current) break;
      }
      setWaitingForAI(false);
    }

    // If AI failed, show error and let user retry
    if (aiErrorRef.current || !aiResultRef.current) {
      const errorMsg = aiErrorRef.current || 'Portfolio generation timed out';
      if (aiFlowActiveRef.current) {
        setWaitingForAI(false);
        setAiGenerationError(errorMsg);
        return;
      }
      toast({
        title: 'Portfolio generation failed',
        description: `${errorMsg}. You can try again.`,
        variant: 'destructive',
      });
      handleStartOver();
      return;
    }

    // Use the AI-generated portfolio
    const ai = aiResultRef.current;
    const strategyName = ai.strategy?.name
      ? `${name.split('-')[0]}-${name.split('-')[1]}` // Keep the gem-number format
      : name;

    setAiStrategyMeta({
      name: ai.strategy?.name || strategyName,
      description: ai.strategy?.description || '',
      riskLevel: ai.strategy?.riskLevel || 'moderate',
    });

    const cappedApiHoldings = capHoldingsByAllocation(ai.holdings || [], AI_RESULTS_MAX_HOLDINGS);

    const aiHoldings: GeneratedHolding[] = cappedApiHoldings.map(h => ({
      ticker: h.symbol,
      name: h.name,
      weight: h.allocation,
      role: typeToRole(h.type),
      explanation: h.reasoning,
      alignment: h.reasoning, // AI provides one combined reasoning field
      characteristics: [h.type],
      tradeoff: '',
    }));

    // Build strategy breakdown from capped holdings
    const breakdownMap = new Map<string, number>();
    for (const h of cappedApiHoldings) {
      const existing = breakdownMap.get(h.type) || 0;
      breakdownMap.set(h.type, existing + h.allocation);
    }
    const strategyBreakdown = Array.from(breakdownMap.entries()).map(([role, percentage]) => ({
      role,
      percentage,
    }));

    const portfolio = {
      name: strategyName,
      holdings: aiHoldings,
      excluded: [] as ExcludedHolding[],
      strategyBreakdown,
      rationale: ai.strategy?.description || 'AI-generated portfolio based on your preferences.',
      risks: `Risk level: ${ai.strategy?.riskLevel || 'moderate'}. This portfolio was tailored to your questionnaire answers using live market data.`,
    };

    setGeneratedPortfolio(portfolio);
    setEditableHoldings(portfolio.holdings.map((h, i) => ({
      id: String(i),
      ticker: h.ticker,
      name: h.name,
      weight: h.weight,
    })));
    setCreationStep('results');
    aiFlowActiveRef.current = false;

    // Fetch live prices for all tickers
    fetchPrices(portfolio.holdings.map(h => h.ticker));
  };

  const handleStartOver = () => {
    setCreationStep('questionnaire');
    setStrategyProfile(initialProfile);
    setGemAnimationProfile(initialProfile);
    setGeneratedPortfolio(null);
    setGeneratedStrategyName('');
    setEditableHoldings([]);
    setEditOpen(false);
    setUsedAiLedFlow(false);
    setAiGenerationError(null);
    setAiFlowResume(null);
    setAiFlowSessionKey((k) => k + 1);
    setCrystallizeKey((k) => k + 1);
    setAiStrategyMeta(null);
    lastCrystallizePayloadRef.current = null;
    aiResumeContextRef.current = { gemProposalLevel: null, wizardState: null };
    aiFlowActiveRef.current = false;
    aiResultRef.current = null;
    aiErrorRef.current = null;
    setInvestExecuting(false);
  };

  const persistPortfolio = async (portfolioId: string, status: 'live' | 'simulating') => {
    const riskLevel = deriveRiskLevel(strategyProfile);
    const objectiveMap: Record<string, string> = {
      accumulation: 'Growth',
      retirement: 'Balanced',
      income: 'Income',
      preservation: 'Low volatility',
      aggressive: 'Growth',
    };

    try {
      const supabaseId = await createPortfolio({
        name: generatedStrategyName,
        objective: objectiveMap[strategyProfile.primaryGoal || 'accumulation'] || 'Growth',
        riskLevel,
        status: status === 'live' ? 'private' : 'private',
        holdings: editableHoldings.map(h => ({ ticker: h.ticker, name: h.name, weight: h.weight })),
        descriptionRationale: generatedPortfolio?.rationale,
        sectors: [...new Set(editableHoldings.map(h => h.name.split(' ')[0]))],
      });

      // Also keep localStorage as fallback during migration
      const fallback = {
        id: supabaseId,
        name: generatedStrategyName,
        creator_id: 'self',
        status,
        risk_level: riskLevel,
        objective: strategyProfile.primaryGoal || 'accumulation',
        performance: { return_30d: 0, max_drawdown: 0, consistency_score: 50 },
        followers: 0,
        allocated: 0,
        creator_investment: 0,
        holdings: editableHoldings.map(h => ({ ticker: h.ticker, name: h.name, weight: h.weight })),
        created_date: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]');
      existing.push(fallback);
      localStorage.setItem('userCreatedPortfolios', JSON.stringify(existing));

      return supabaseId;
    } catch (err) {
      console.error('Supabase save failed, falling back to localStorage:', err);
      // Fallback: save to localStorage only
      const fallback = {
        id: portfolioId,
        name: generatedStrategyName,
        creator_id: 'self',
        status,
        risk_level: riskLevel,
        objective: strategyProfile.primaryGoal || 'accumulation',
        performance: { return_30d: 0, max_drawdown: 0, consistency_score: 50 },
        followers: 0,
        allocated: 0,
        creator_investment: 0,
        holdings: editableHoldings.map(h => ({ ticker: h.ticker, name: h.name, weight: h.weight })),
        created_date: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]');
      existing.push(fallback);
      localStorage.setItem('userCreatedPortfolios', JSON.stringify(existing));
      return portfolioId;
    }
  };

  const totalWeight = editableHoldings.reduce((acc, h) => acc + h.weight, 0);

  const updateHoldingWeight = (id: string, weight: number) => {
    setEditableHoldings(prev => prev.map(h => h.id === id ? { ...h, weight } : h));
  };

  const removeHolding = (id: string) => {
    setEditableHoldings(prev => prev.filter(h => h.id !== id));
  };

  const addHolding = () => {
    setEditableHoldings(prev => [...prev, { id: Date.now().toString(), ticker: '', name: '', weight: 0 }]);
  };

  const autoBalance = () => {
    const count = editableHoldings.length;
    if (count === 0) return;
    const each = Math.floor(100 / count);
    const remainder = 100 - each * count;
    setEditableHoldings(prev => prev.map((h, i) => ({ ...h, weight: each + (i === 0 ? remainder : 0) })));
  };

  // Gem color helpers
  const getGemColor = (name: string) => {
    const gem = name.split('-')[0];
    const colors: Record<string, string> = { Ruby: '#E11D48', Sapphire: '#3B82F6', Pearl: '#E2E8F0' };
    return colors[gem] || '#7C3AED';
  };

  const getGemDescription = (name: string) => {
    const gem = name.split('-')[0];
    const descs: Record<string, string> = {
      Pearl: 'Pearl embodies your conservative, stability-first philosophy — smooth and secure.',
      Sapphire: 'Sapphire reflects your balanced approach — steady growth with measured risk.',
      Ruby: 'Ruby captures your bold, growth-driven ambition — high energy, high potential.',
    };
    return descs[gem] || `${gem} reflects your personalized investment approach`;
  };

  const renderAiLedResults = () => {
    if (!generatedPortfolio) return null;
    const aiHoldingsSorted = [...generatedPortfolio.holdings].sort((a, b) => b.weight - a.weight);

    return (
      <div className="qa-reveal-stagger relative pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-h-[min(520px,calc(100dvh-11rem))] overflow-y-auto overscroll-contain space-y-2 pr-0.5">
            <div className="space-y-1">
              <h2
                className="text-xl sm:text-2xl font-bold text-foreground leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {aiStrategyMeta?.name ?? generatedPortfolio.name}
              </h2>
              <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                {aiStrategyMeta?.description ?? generatedPortfolio.rationale}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              {aiHoldingsSorted.map((holding) => {
                const typeLabel = holding.characteristics[0] ?? holding.role;
                return (
                  <details
                    key={holding.ticker}
                    className="group rounded-lg border border-white/10 bg-white/[0.03] open:bg-white/[0.05] transition-colors"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 text-sm [&::-webkit-details-marker]:hidden">
                      <span className="shrink-0 font-semibold tabular-nums text-foreground">{holding.ticker}</span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{holding.name}</span>
                      <span className="shrink-0 tabular-nums font-semibold text-foreground">{holding.weight}%</span>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-white/20 bg-white/5 px-1.5 py-0 text-[10px] uppercase tracking-wide"
                      >
                        {typeLabel}
                      </Badge>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-white/[0.06] px-2.5 py-2 text-xs leading-snug text-muted-foreground">
                      {holding.explanation}
                    </div>
                  </details>
                );
              })}
            </div>

            <Collapsible defaultOpen={false}>
              <div className="rounded-lg border border-destructive/25 bg-destructive/[0.06]">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm font-medium text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    Key Risks
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2.5 pb-2.5">
                <p className="text-xs leading-relaxed text-muted-foreground">{generatedPortfolio.risks}</p>
              </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-[rgba(124,58,237,0.28)] bg-[rgba(124,58,237,0.06)] px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-[rgba(124,58,237,0.1)]"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-violet-400" />
                    How we built your portfolio
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-relaxed text-muted-foreground">
                <p>{aiStrategyMeta?.description ?? generatedPortfolio.rationale}</p>
                <p className="mt-2">
                  The AI analyzed live market data, your onboarding investor profile, and the sector, volatility, and
                  geography preferences you chose during refinement — so this allocation is personalized, not a fixed
                  template.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={editOpen} onOpenChange={setEditOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border/30 bg-secondary/20 px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/40"
                >
                  <span>Edit holdings (add, remove, weights)</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${editOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3">
                    <CardTitle className="text-sm">Edit Holdings</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={autoBalance}>
                        <Scale className="h-3 w-3 mr-1" />
                        Balance
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addHolding}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-8 text-xs">Ticker</TableHead>
                          <TableHead className="h-8 text-xs">Name</TableHead>
                          <TableHead className="h-8 w-[4.5rem] text-right text-xs">%</TableHead>
                          <TableHead className="h-8 w-8 p-0" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editableHoldings.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="py-1.5">
                              <Input
                                value={h.ticker}
                                onChange={(e) =>
                                  setEditableHoldings((prev) =>
                                    prev.map((x) =>
                                      x.id === h.id ? { ...x, ticker: e.target.value.toUpperCase() } : x,
                                    ),
                                  )
                                }
                                className="h-8 bg-secondary text-xs"
                              />
                            </TableCell>
                            <TableCell className="py-1.5 text-muted-foreground text-xs">{h.name || '—'}</TableCell>
                            <TableCell className="py-1.5">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                required
                                value={h.weight || ''}
                                onChange={(e) => updateHoldingWeight(h.id, parseFloat(e.target.value) || 0)}
                                className="h-8 bg-secondary text-right text-xs"
                              />
                            </TableCell>
                            <TableCell className="py-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeHolding(h.id)}
                                disabled={editableHoldings.length <= 1}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total Weight</span>
                        <span
                          className={cn(
                            'font-medium tabular-nums',
                            totalWeight === 100 ? 'text-success' : 'text-warning',
                          )}
                        >
                          {totalWeight.toFixed(1)}%
                          {totalWeight !== 100 && ' (target 100%)'}
                        </span>
                      </div>
                      {totalWeight !== 100 && (
                        <p className="text-xs text-warning">Adjust weights to total 100%.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050508]/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-[#050508]/85"
            style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Button
                  className="h-11 flex-1 bg-white text-[#050508] hover:bg-white/90 font-semibold"
                  disabled={investExecuting || totalWeight !== 100}
                  onClick={async () => {
                    const ai = aiResultRef.current;
                    const investmentAmount = strategyProfile.investmentAmount;
                    if (!ai || investmentAmount == null) {
                      toast({
                        variant: 'destructive',
                        title: 'Missing data',
                        description: 'Portfolio or investment amount is unavailable. Try creating the portfolio again.',
                      });
                      return;
                    }
                    try {
                      setInvestExecuting(true);
                      const holdingsPayload: ApiGeneratedHolding[] = editableHoldings.map((eh) => {
                        const orig = ai.holdings.find((o) => o.symbol === eh.ticker);
                        return {
                          symbol: eh.ticker,
                          name: orig?.name ?? eh.name,
                          allocation: eh.weight,
                          type: orig?.type ?? 'ETF',
                          reasoning: orig?.reasoning ?? '',
                        };
                      });
                      await executePortfolio(
                        holdingsPayload,
                        ai.strategy,
                        investmentAmount,
                        ai.strategy.name,
                      );
                      toast({
                        title: 'Orders submitted',
                        description: 'Your portfolio trades are being placed. Taking you to the dashboard.',
                      });
                      navigate('/dashboard');
                    } catch (err) {
                      toast({
                        variant: 'destructive',
                        title: 'Could not place trades',
                        description: err instanceof Error ? err.message : 'Unknown error',
                      });
                    } finally {
                      setInvestExecuting(false);
                    }
                  }}
                >
                  {investExecuting ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Scale className="h-5 w-5 mr-2" />
                  )}
                  Invest
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-white/25 bg-transparent text-white hover:bg-white/10 sm:min-w-[120px]"
                  onClick={handleAdjustFromAiResults}
                >
                  Adjust
                </Button>
              </div>
              <p className="text-center text-[10px] leading-tight text-muted-foreground">
                Paper trading — refine weights above, then invest. Platform fee: 0.25% annually.
              </p>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  ↺ Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  };

  const renderLegacyResults = () => (
    <div className="space-y-6 qa-reveal-stagger">
      {generatedPortfolio && (
        <>
          {/* Portfolio Header */}
          <Card className="glass-card" style={{ borderColor: `${getGemColor(generatedPortfolio.name)}30` }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span style={{ color: getGemColor(generatedPortfolio.name), textShadow: `0 0 20px ${getGemColor(generatedPortfolio.name)}40` }}>
                  {generatedPortfolio.name}
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 italic">{getGemDescription(generatedPortfolio.name)}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Allocation Breakdown
                </h4>
                <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-3">
                  {generatedPortfolio.strategyBreakdown.map((item, idx) => (
                    <div
                      key={item.role}
                      className="relative flex items-center justify-center text-xs font-medium text-white"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: sectorColors[idx % sectorColors.length],
                      }}
                    >
                      {item.percentage}%
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {generatedPortfolio.strategyBreakdown.map((item, idx) => (
                    <div key={item.role} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{
                        backgroundColor: sectorColors[idx % sectorColors.length],
                      }} />
                      <span className="text-muted-foreground">{item.role} — {item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holdings & Rationale */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Holdings & Rationale</CardTitle>
              <p className="text-sm text-muted-foreground">Click on each holding to see why it was selected</p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {generatedPortfolio.holdings.map((holding) => (
                  <AccordionItem key={holding.ticker} value={holding.ticker} className="border-border/50">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <span className="font-semibold text-foreground">{holding.ticker}</span>
                            <span className="text-muted-foreground ml-2 text-sm hidden sm:inline">{holding.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {holdingPrices[holding.ticker] && (
                            <div className="text-right mr-2 hidden sm:block">
                              <span className="text-sm font-medium text-foreground">${holdingPrices[holding.ticker].price.toFixed(2)}</span>
                              <span className={cn(
                                'text-xs ml-1.5',
                                holdingPrices[holding.ticker].changePercent >= 0 ? 'text-success' : 'text-destructive'
                              )}>
                                {holdingPrices[holding.ticker].changePercent >= 0 ? '+' : ''}{holdingPrices[holding.ticker].changePercent.toFixed(2)}%
                              </span>
                            </div>
                          )}
                          <Badge variant="outline" className={`${roleColors[holding.role]} flex items-center gap-1`} style={{ background: 'rgba(148,163,184,0.15)', color: '#94A3B8', borderColor: 'rgba(148,163,184,0.2)' }}>
                            {roleIcons[holding.role]}
                            {holding.role}
                          </Badge>
                          <span className="font-medium text-primary min-w-[3rem] text-right">{holding.weight}%</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2 pl-2">
                        {holdingPrices[holding.ticker] && (
                          <div className="sm:hidden flex items-center gap-2 text-sm">
                            <DollarSign className="h-3.5 w-3.5 text-primary" />
                            <span className="font-medium">${holdingPrices[holding.ticker].price.toFixed(2)}</span>
                            <span className={cn(
                              holdingPrices[holding.ticker].changePercent >= 0 ? 'text-success' : 'text-destructive'
                            )}>
                              {holdingPrices[holding.ticker].changePercent >= 0 ? '+' : ''}{holdingPrices[holding.ticker].changePercent.toFixed(2)}% today
                            </span>
                          </div>
                        )}
                        <div>
                          <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            Why {holding.ticker}?
                          </h5>
                          <p className="text-sm text-muted-foreground">{holding.explanation}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-success" />
                            How it matches your goals
                          </h5>
                          <p className="text-sm text-muted-foreground">{holding.alignment}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm mb-2">Key Characteristics</h5>
                          <div className="flex flex-wrap gap-2">
                            {holding.characteristics.map((char, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{char}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                            Trade-off to Consider
                          </h5>
                          <p className="text-sm text-muted-foreground">{holding.tradeoff}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Portfolio Rationale */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Portfolio Rationale</CardTitle></CardHeader>
            <CardContent><p className="text-base text-muted-foreground leading-relaxed">{generatedPortfolio.rationale}</p></CardContent>
          </Card>

          {/* Key Risks */}
          <Card className="glass-card border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Key Risks
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-base text-muted-foreground leading-relaxed">{generatedPortfolio.risks}</p></CardContent>
          </Card>

          {/* How We Built Your Portfolio — methodology transparency */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-sm">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <Info className="h-4 w-4 text-primary" />
                  How we built your portfolio
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Card className="glass-card border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Risk Assessment</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your risk level was determined by weighting three categories: behavioral factors (60%) like your drawdown reaction and volatility tolerance, capacity factors (25%) like your timeline and emergency fund status, and context factors (15%) like income and experience. Behavioral signals carry the most weight because research shows how you react under stress predicts whether you'll stick with your plan.
                    </p>
                  </div>
                  {(() => {
                    const scoring = explainRiskScoring(strategyProfile);
                    return (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Key Factors</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {scoring.factors.map((f) => (
                            <div key={f.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 text-sm">
                              <span className="text-muted-foreground">{f.label}</span>
                              <span className={cn(
                                'font-medium',
                                f.contribution === 'increases' && 'text-success',
                                f.contribution === 'decreases' && 'text-warning',
                              )}>
                                {f.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Portfolio Construction</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Holdings were selected by an AI model (Claude) using your risk profile, sector preferences, geographic focus, and live market data from Alpaca. The AI evaluates current prices, your existing positions, and recent market news to pick 5-8 liquid, tradeable securities with allocations that sum to 100%. Every portfolio is unique to your answers -- there are no pre-built templates.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                    This is a paper-trading portfolio for educational purposes. Past performance does not guarantee future results. Always consult a licensed financial advisor before making real investment decisions.
                  </p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Edit Holdings -- collapsible */}
          <Collapsible open={editOpen} onOpenChange={setEditOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-colors text-sm">
                <span className="text-muted-foreground">Want to adjust? You can add, remove, or change holdings.</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${editOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Edit Holdings</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={autoBalance}>
                      <Scale className="h-3.5 w-3.5 mr-1.5" />
                      Auto-Balance
                    </Button>
                    <Button variant="outline" size="sm" onClick={addHolding}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Holding
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Weight (%)</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editableHoldings.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>
                            <Input
                              value={h.ticker}
                              onChange={(e) => setEditableHoldings(prev => prev.map(x => x.id === h.id ? { ...x, ticker: e.target.value.toUpperCase() } : x))}
                              className="bg-secondary w-20"
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{h.name || '—'}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              required
                              value={h.weight || ''}
                              onChange={(e) => updateHoldingWeight(h.id, parseFloat(e.target.value) || 0)}
                              className="bg-secondary text-right w-20 ml-auto"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeHolding(h.id)} disabled={editableHoldings.length <= 1}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Weight</span>
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          totalWeight === 100 ? 'text-success' : 'text-warning',
                        )}
                      >
                        {totalWeight.toFixed(1)}%
                        {totalWeight !== 100 && ' (target 100%)'}
                      </span>
                    </div>
                    {totalWeight !== 100 && (
                      <p className="text-sm text-warning animate-in fade-in duration-200">
                        Allocations total {totalWeight.toFixed(1)}% — adjust weights so the sum equals 100%.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Investment Summary + CTAs */}
            <div className="space-y-4 pt-2">
              {/* Show chosen investment details */}
              {strategyProfile.investmentAmount != null &&
                typeof strategyProfile.investmentAmount === 'number' && (
                <Card className="glass-card border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Investment Amount</p>
                        <p className="text-lg font-semibold text-foreground">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(strategyProfile.investmentAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Mode</p>
                        <Badge variant={strategyProfile.investmentMode === 'simulated' ? 'secondary' : 'default'}>
                          {strategyProfile.investmentMode === 'simulated' ? 'Practice Mode' : 'Real Money'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                {strategyProfile.investmentMode === 'simulated' ? (
                  <Button
                    onClick={async () => {
                      const portfolioId = generatedStrategyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                      const savedId = await persistPortfolio(portfolioId, 'simulating');
                      navigate(`/simulation/${savedId || portfolioId}`);
                    }}
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={editOpen && totalWeight !== 100}
                  >
                    <Scale className="h-5 w-5 mr-2" />
                    Start Simulation
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      const portfolioId = generatedStrategyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                      const savedId = await persistPortfolio(portfolioId, 'live');
                      toast({ title: "Portfolio created!", description: "Redirecting to your dashboard..." });
                      setTimeout(() => navigate('/dashboard'), 1000);
                    }}
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={editOpen && totalWeight !== 100}
                  >
                    <DollarSign className="h-5 w-5 mr-2" />
                    Invest Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                )}
                {/* Secondary option: the opposite of what they chose */}
                <Button
                  variant="outline"
                  onClick={async () => {
                    const portfolioId = generatedStrategyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    if (strategyProfile.investmentMode === 'simulated') {
                      const savedId = await persistPortfolio(portfolioId, 'live');
                      toast({ title: "Portfolio created!", description: "Redirecting to your dashboard..." });
                      setTimeout(() => navigate('/dashboard'), 1000);
                    } else {
                      const savedId = await persistPortfolio(portfolioId, 'simulating');
                      navigate(`/simulation/${savedId || portfolioId}`);
                    }
                  }}
                  className="h-12 text-base px-6"
                  disabled={editOpen && totalWeight !== 100}
                >
                  {strategyProfile.investmentMode === 'simulated' ? 'Invest Real Money' : 'Simulate First'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {strategyProfile.investmentMode === 'simulated'
                  ? "Practice mode uses real market data with no actual money at risk. You can switch to real money anytime."
                  : "You can always switch to simulation mode later if you change your mind."}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Platform fee: 0.25% annually on invested capital
              </p>
              <div className="text-center">
                <button
                  onClick={handleStartOver}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  ↺ Start Over
                </button>
              </div>
          </div>
        </>
      )}
    </div>
  );

  const renderResultsContent = () => {
    if (generatedPortfolio && usedAiLedFlow) {
      return renderAiLedResults();
    }
    return renderLegacyResults();
  };

  // Show tabs only during questionnaire step of AI flow (or always for manual)
  const showTabs = activeTab === 'manual' || creationStep === 'questionnaire';

  return (
    <PageLayout>
      {/* Manual tab background orb */}
      {activeTab === 'manual' && manualOrbColor && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute rounded-full"
            style={{
              width: '45vw',
              height: '45vw',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: `radial-gradient(circle, ${manualOrbColor} 0%, transparent 60%)`,
              filter: 'blur(80px)',
              animation: 'orbDrift1 18s ease-in-out infinite',
              transition: 'background 0.8s ease',
            }}
          />
        </div>
      )}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          {showTabs && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2">Create Portfolio</h1>
                <p className="text-muted-foreground">
                  {activeTab === 'ai'
                    ? 'Your AI co-pilot reviews your profile, proposes a direction, and builds allocations to match.'
                    : 'Build your portfolio manually by selecting holdings and allocations.'}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center justify-center gap-1 mb-8 p-1 rounded-xl mx-auto w-fit" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === 'ai'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]'
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  AI-Assisted
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === 'manual'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]'
                  )}
                >
                  <PenLine className="h-4 w-4" />
                  Manual
                </button>
              </div>
            </>
          )}

          {/* AI-Assisted Flow */}
          {activeTab === 'ai' && (
            <>
              {creationStep === 'questionnaire' && (
                <div>
                  <AiLedPortfolioCreation
                    key={aiFlowSessionKey}
                    resume={aiFlowResume}
                    onCancel={() => navigate(-1)}
                    onBeginCrystallization={handleBeginAiCrystallization}
                  />
                </div>
              )}
              {creationStep === 'animation' && (
                aiGenerationError ? (
                  <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-6 px-4 text-center max-w-md mx-auto">
                    <p className="text-foreground">{aiGenerationError}</p>
                    <Button
                      className="bg-white text-[#050508] hover:bg-white/90 font-semibold"
                      onClick={handleRetryAiGeneration}
                    >
                      Try again
                    </Button>
                  </div>
                ) : waitingForAI ? (
                  <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Finalizing your portfolio with live market data...</p>
                    <p className="text-xs text-muted-foreground">Almost there</p>
                  </div>
                ) : (
                  <ParticleCrystallizationAnimation
                    key={crystallizeKey}
                    profile={gemAnimationProfile}
                    onComplete={handleAnimationComplete}
                  />
                )
              )}
              {creationStep === 'results' && (
                <div className="space-y-6">
                  {renderResultsContent()}
                </div>
              )}
            </>
          )}

          {/* Manual Flow */}
          {activeTab === 'manual' && (
            <ManualPortfolioBuilder onOrbColorChange={setManualOrbColor} />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
