import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, ArrowRight, Info, TrendingUp, Shield, Globe, Coins, AlertTriangle, DollarSign, Scale, ChevronDown, PenLine, Loader2 } from 'lucide-react';
import { generatePortfolio } from '@/lib/portfolioService';
import type { QuestionnaireAnswers, GeneratePortfolioResponse } from '@/lib/portfolioTypes';
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
import { PortfolioQuestionnaire } from '@/components/strategy-creation/PortfolioQuestionnaire';
import { ParticleCrystallizationAnimation } from '@/components/strategy-creation/ParticleCrystallizationAnimation';
import { ManualPortfolioBuilder } from '@/components/strategy-creation/ManualPortfolioBuilder';
import { StrategyProfile, initialProfile, deriveRiskLevel, explainRiskScoring } from '@/lib/strategyProfile';
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

// ── Convert StrategyProfile codes to readable strings for Claude ──
const goalLabels: Record<string, string> = {
  accumulation: 'Long-term wealth accumulation',
  retirement: 'Retirement savings',
  income: 'Income generation from dividends and interest',
  preservation: 'Capital preservation',
  aggressive: 'Aggressive growth, accepting higher risk',
};
const timelineLabels: Record<string, string> = {
  '1-2': '1-2 years (short-term)',
  '3-5': '3-5 years (medium-term)',
  '5-10': '5-10 years (long-term)',
  '10+': '10+ years (very long-term)',
};
const drawdownLabels: Record<string, string> = {
  'sell-all': 'Very conservative - would sell everything on a 20% drop',
  'sell-some': 'Cautious - would reduce exposure on a 20% drop',
  hold: 'Moderate - would hold steady through a 20% drop',
  'buy-more': 'Aggressive - would buy more on a 20% drop',
};
const geoLabels: Record<string, string> = {
  us: 'Primarily US-focused',
  global: 'Global diversification (US + international mix)',
  emerging: 'Emerging markets focus (higher growth potential)',
  international: 'International developed markets (Europe, Japan, Australia)',
};

const incomeLabels: Record<string, string> = {
  'under-50k': 'Under $50k/year',
  '50k-100k': '$50k-$100k/year',
  '100k-200k': '$100k-$200k/year',
  '200k-500k': '$200k-$500k/year',
  '500k-plus': '$500k+/year',
};
const experienceLabels: Record<string, string> = {
  none: 'No investing experience',
  beginner: 'Beginner (under 1 year)',
  intermediate: 'Intermediate (a few years)',
  advanced: 'Advanced (5+ years)',
};
const accountTypeLabels: Record<string, string> = {
  taxable: 'Taxable brokerage account',
  'retirement-ira': 'IRA (Traditional or Roth)',
  'retirement-401k': '401(k) / 403(b)',
  mixed: 'Multiple account types',
};
const portfolioSizeLabels: Record<string, string> = {
  'under-10k': 'Under $10k',
  '10k-50k': '$10k-$50k',
  '50k-250k': '$50k-$250k',
  '250k-1m': '$250k-$1M',
  '1m-plus': '$1M+',
};
const ageRangeLabels: Record<string, string> = {
  '18-29': 'Age 18-29',
  '30-39': 'Age 30-39',
  '40-49': 'Age 40-49',
  '50-59': 'Age 50-59',
  '60-plus': 'Age 60+',
};
const emergencyFundLabels: Record<string, string> = {
  'yes-6mo': '6+ months of expenses saved',
  'yes-3mo': '3-6 months saved',
  building: 'Building emergency fund',
  no: 'No emergency fund yet',
};

function profileToAnswers(profile: StrategyProfile): QuestionnaireAnswers {
  const sectors = profile.sectorEmphasis.length > 0
    ? profile.sectorEmphasis.join(', ')
    : 'No specific sector preference (broad diversification)';

  return {
    goal: goalLabels[profile.primaryGoal || ''] || 'Wealth accumulation',
    timeline: timelineLabels[profile.timeline || ''] || '5-10 years',
    risk: drawdownLabels[profile.drawdownReaction || ''] || 'Moderate',
    sectors,
    geography: geoLabels[profile.geographicPreference || ''] || 'US-focused',
    volatility: `Comfortable with up to ${profile.volatilityTolerance}% portfolio swings`,
    income: incomeLabels[profile.incomeRange || ''] || undefined,
    experience: experienceLabels[profile.investmentExperience || ''] || undefined,
    accountType: accountTypeLabels[profile.accountType || ''] || undefined,
    portfolioSize: portfolioSizeLabels[profile.portfolioSize || ''] || undefined,
    ageRange: ageRangeLabels[profile.ageRange || ''] || undefined,
    emergencyFund: emergencyFundLabels[profile.hasEmergencyFund || ''] || undefined,
  };
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

  // Manual tab orb color
  const [manualOrbColor, setManualOrbColor] = useState<string | null>(null);

  // Editable holdings state
  const [editableHoldings, setEditableHoldings] = useState<EditableHolding[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  // AI portfolio generation state
  const aiResultRef = useRef<GeneratePortfolioResponse | null>(null);
  const aiErrorRef = useRef<string | null>(null);
  const [waitingForAI, setWaitingForAI] = useState(false);

  const handleQuestionnaireComplete = (profile: StrategyProfile) => {
    setStrategyProfile(profile);
    setCreationStep('animation');

    // Fire AI generation in parallel with the animation
    aiResultRef.current = null;
    aiErrorRef.current = null;
    const answers = profileToAnswers(profile);
    generatePortfolio(answers)
      .then((result) => { aiResultRef.current = result; })
      .catch((err) => {
        console.error('[Invest] AI portfolio generation failed:', err);
        aiErrorRef.current = err instanceof Error ? err.message : 'Portfolio generation failed';
      });
  };

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

    const aiHoldings: GeneratedHolding[] = ai.holdings.map(h => ({
      ticker: h.symbol,
      name: h.name,
      weight: h.allocation,
      role: typeToRole(h.type),
      explanation: h.reasoning,
      alignment: h.reasoning, // AI provides one combined reasoning field
      characteristics: [h.type],
      tradeoff: '',
    }));

    // Build strategy breakdown from holdings
    const breakdownMap = new Map<string, number>();
    for (const h of ai.holdings) {
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
  };

  const handleStartOver = () => {
    setCreationStep('questionnaire');
    setStrategyProfile(initialProfile);
    setGeneratedPortfolio(null);
    setGeneratedStrategyName('');
    setEditableHoldings([]);
    setEditOpen(false);
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
        descriptionRationale: generatedPortfolio?.strategy?.description,
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

  const renderResultsContent = () => (
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
                              min="0"
                              max="100"
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
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Weight</span>
                    <span className={totalWeight === 100 ? 'text-success' : 'text-destructive'}>
                      {totalWeight}% {totalWeight !== 100 && '(must equal 100%)'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Bottom CTAs */}
            <div className="space-y-4 pt-2">
              <div className="flex gap-3">
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
                <Button
                  variant="outline"
                  onClick={async () => {
                    const portfolioId = generatedStrategyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const savedId = await persistPortfolio(portfolioId, 'simulating');
                    navigate(`/simulation/${savedId || portfolioId}`);
                  }}
                  className="flex-1 h-12 text-base"
                  disabled={editOpen && totalWeight !== 100}
                >
                  Simulate First
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Simulation is optional. You can invest directly or test with live data first.
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
                    ? 'Answer a few questions and the AI will build a personalized portfolio for you.'
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
                <div data-tour="ai-wizard">
                  <PortfolioQuestionnaire
                    onComplete={handleQuestionnaireComplete}
                    onCancel={() => navigate(-1)}
                  />
                </div>
              )}
              {creationStep === 'animation' && (
                waitingForAI ? (
                  <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Finalizing your portfolio with live market data...</p>
                    <p className="text-xs text-muted-foreground">Almost there</p>
                  </div>
                ) : (
                  <ParticleCrystallizationAnimation
                    profile={strategyProfile}
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
