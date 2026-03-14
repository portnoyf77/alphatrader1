import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, ArrowRight, Info, TrendingUp, Shield, Globe, Coins, AlertTriangle, DollarSign, Scale, ChevronDown, PenLine } from 'lucide-react';
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
import { StrategyProfile, initialProfile, deriveRiskLevel } from '@/lib/strategyProfile';
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

const enhancedGeneratedHoldings: GeneratedHolding[] = [
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 35, role: 'Core', explanation: 'VTI provides comprehensive exposure to the entire U.S. stock market.', alignment: 'Matches your growth objective while providing broad diversification.', characteristics: ['Ultra-low 0.03% expense ratio', 'High liquidity with $1T+ AUM', 'Covers 3,500+ U.S. stocks'], tradeoff: 'Lower potential upside than concentrated sector bets, but significantly reduces single-stock risk.' },
  { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 20, role: 'International', explanation: 'VXUS delivers exposure to developed and emerging markets outside the U.S.', alignment: 'Directly addresses your request for international exposure.', characteristics: ['0.07% expense ratio', '7,800+ international stocks', 'Covers 40+ countries'], tradeoff: 'Introduces currency risk but provides valuable diversification.' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', weight: 20, role: 'Growth', explanation: 'QQQ tracks the Nasdaq-100 Index, providing concentrated tech exposure.', alignment: 'Fulfills your tech sector focus requirement.', characteristics: ['Heavy tech concentration (50%+)', 'Top 100 Nasdaq companies', 'Strong historical performance'], tradeoff: 'Higher volatility but historically delivers outsized returns during bull markets.' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 15, role: 'Stability', explanation: 'BND provides exposure to the entire U.S. investment-grade bond market.', alignment: 'Adds a buffer against equity volatility.', characteristics: ['0.03% expense ratio', '10,000+ bond holdings', 'Investment-grade focus'], tradeoff: 'Lower returns than equities but provides crucial downside protection.' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', weight: 10, role: 'Hedge', explanation: 'GLD tracks the price of physical gold bullion.', alignment: 'Provides portfolio insurance against inflation and uncertainty.', characteristics: ['Physical gold backing', 'High liquidity', 'Inflation protection'], tradeoff: 'No dividend income but provides valuable protection during crises.' },
];

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

  const handleQuestionnaireComplete = (profile: StrategyProfile) => {
    setStrategyProfile(profile);
    setCreationStep('animation');
  };

  const handleAnimationComplete = (name: string) => {
    setGeneratedStrategyName(name);
    const portfolio = {
      name,
      holdings: enhancedGeneratedHoldings,
      excluded: [] as ExcludedHolding[],
      strategyBreakdown: [
        { role: 'Broad Market', percentage: 35 },
        { role: 'International', percentage: 20 },
        { role: 'Technology', percentage: 20 },
        { role: 'Bonds', percentage: 15 },
        { role: 'Commodities', percentage: 10 },
      ],
      rationale: `This portfolio was built to help you ${strategyProfile.primaryGoal === 'accumulation' ? 'grow your money' : strategyProfile.primaryGoal === 'income' ? 'earn regular income' : 'protect what you have'} over ${strategyProfile.timeline || '5-10'} years. We balanced growth opportunities with stability for a portfolio that can grow without keeping you up at night.`,
      risks: 'This portfolio carries moderate equity risk with exposure to technology concentration, currency risk from international holdings, and interest rate sensitivity from bonds.',
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

  const persistPortfolio = (portfolioId: string, status: 'live' | 'simulating') => {
    const riskLevel = deriveRiskLevel(strategyProfile);
    const newPortfolio = {
      id: portfolioId,
      name: generatedStrategyName,
      creator_id: '@alex_investor',
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
    existing.push(newPortfolio);
    localStorage.setItem('userCreatedPortfolios', JSON.stringify(existing));
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
            <CardContent><p className="text-sm text-muted-foreground">{generatedPortfolio.rationale}</p></CardContent>
          </Card>

          {/* Key Risks */}
          <Card className="glass-card border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Key Risks
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{generatedPortfolio.risks}</p></CardContent>
          </Card>

          {/* Edit Holdings — collapsible */}
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
                  onClick={() => {
                    const portfolioId = generatedStrategyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    persistPortfolio(portfolioId, 'live');
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
                  onClick={() => {
                    const portfolioId = generatedStrategyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    persistPortfolio(portfolioId, 'simulating');
                    navigate(`/simulation/${portfolioId}`);
                  }}
                  className="flex-1 h-12 text-base"
                  disabled={editOpen && totalWeight !== 100}
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
            <div className="text-center">
              <button
                onClick={handleStartOver}
                className="text-sm transition-colors inline-flex items-center gap-1.5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
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
                <ParticleCrystallizationAnimation
                  profile={strategyProfile}
                  onComplete={handleAnimationComplete}
                />
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
