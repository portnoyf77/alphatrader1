import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wrench, Plus, Trash2, ArrowRight, Save, Info, TrendingUp, Shield, Globe, Coins, AlertTriangle, RotateCcw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';
import { ConversationalQA } from '@/components/strategy-creation/ConversationalQA';
import { ParticleCrystallizationAnimation } from '@/components/strategy-creation/ParticleCrystallizationAnimation';
import { StrategyProfile, initialProfile } from '@/lib/strategyProfile';

interface HoldingRow {
  id: string;
  ticker: string;
  weight: number;
}

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

const enhancedGeneratedHoldings: GeneratedHolding[] = [
  { 
    ticker: 'VTI', 
    name: 'Vanguard Total Stock Market ETF', 
    weight: 35,
    role: 'Core',
    explanation: 'VTI provides comprehensive exposure to the entire U.S. stock market, including large, mid, and small-cap stocks.',
    alignment: 'Matches your growth objective while providing the broad diversification needed for medium-risk tolerance.',
    characteristics: ['Ultra-low 0.03% expense ratio', 'High liquidity with $1T+ AUM', 'Covers 3,500+ U.S. stocks'],
    tradeoff: 'Lower potential upside than concentrated sector bets, but significantly reduces single-stock risk.'
  },
  { 
    ticker: 'VXUS', 
    name: 'Vanguard Total Intl Stock ETF', 
    weight: 20,
    role: 'International',
    explanation: 'VXUS delivers exposure to developed and emerging markets outside the U.S.',
    alignment: 'Directly addresses your request for international exposure while maintaining a growth orientation.',
    characteristics: ['0.07% expense ratio', '7,800+ international stocks', 'Covers 40+ countries'],
    tradeoff: 'Introduces currency risk but provides valuable diversification when U.S. markets underperform.'
  },
  { 
    ticker: 'QQQ', 
    name: 'Invesco QQQ Trust', 
    weight: 20,
    role: 'Growth',
    explanation: 'QQQ tracks the Nasdaq-100 Index, providing concentrated exposure to tech giants.',
    alignment: 'Fulfills your tech sector focus requirement with exposure to market-leading innovation companies.',
    characteristics: ['Heavy tech concentration (50%+)', 'Top 100 Nasdaq companies', 'Strong historical performance'],
    tradeoff: 'Higher volatility than broad market ETFs but historically delivers outsized returns during bull markets.'
  },
  { 
    ticker: 'BND', 
    name: 'Vanguard Total Bond Market ETF', 
    weight: 15,
    role: 'Stability',
    explanation: 'BND provides exposure to the entire U.S. investment-grade bond market.',
    alignment: 'Addresses your medium-risk tolerance by adding a buffer against equity volatility.',
    characteristics: ['0.03% expense ratio', '10,000+ bond holdings', 'Investment-grade focus'],
    tradeoff: 'Lower returns than equities but provides crucial downside protection during market crashes.'
  },
  { 
    ticker: 'GLD', 
    name: 'SPDR Gold Shares', 
    weight: 10,
    role: 'Hedge',
    explanation: 'GLD tracks the price of physical gold bullion, serving as an inflation hedge.',
    alignment: 'Provides portfolio insurance against inflation and economic uncertainty.',
    characteristics: ['Physical gold backing', 'High liquidity', 'Inflation protection'],
    tradeoff: 'No dividend income but provides valuable protection during crises and inflationary periods.'
  },
];

const excludedHoldings: ExcludedHolding[] = [
  { ticker: 'XLE', name: 'Energy Select Sector SPDR', reason: 'Excluded per your fossil fuel avoidance preference' },
  { ticker: 'VDE', name: 'Vanguard Energy ETF', reason: 'Excluded per your fossil fuel avoidance preference' },
];

const roleColors: Record<GeneratedHolding['role'], string> = {
  Core: 'bg-primary/20 text-primary border-primary/30',
  Growth: 'bg-success/20 text-success border-success/30',
  Stability: 'bg-muted text-muted-foreground border-muted-foreground/30',
  Hedge: 'bg-warning/20 text-warning border-warning/30',
  International: 'bg-accent/20 text-accent-foreground border-accent/30',
};

const roleIcons: Record<GeneratedHolding['role'], React.ReactNode> = {
  Core: <TrendingUp className="h-3 w-3" />,
  Growth: <TrendingUp className="h-3 w-3" />,
  Stability: <Shield className="h-3 w-3" />,
  Hedge: <Coins className="h-3 w-3" />,
  International: <Globe className="h-3 w-3" />,
};

type CreationStep = 'questionnaire' | 'animation' | 'results';

export default function Create() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('genai');
  
  // GenAI state - new questionnaire flow
  const [creationStep, setCreationStep] = useState<CreationStep>('questionnaire');
  const [strategyProfile, setStrategyProfile] = useState<StrategyProfile>(initialProfile);
  const [generatedStrategyName, setGeneratedStrategyName] = useState<string>('');
  const [generatedPortfolio, setGeneratedPortfolio] = useState<{
    name: string;
    holdings: GeneratedHolding[];
    excluded: ExcludedHolding[];
    strategyBreakdown: { role: string; percentage: number }[];
    rationale: string;
    risks: string;
  } | null>(null);

  // Manual state
  const [manualHoldings, setManualHoldings] = useState<HoldingRow[]>([
    { id: '1', ticker: '', weight: 0 }
  ]);
  const [manualObjective, setManualObjective] = useState('');
  const [manualRisk, setManualRisk] = useState('');

  const handleQuestionnaireComplete = (profile: StrategyProfile) => {
    setStrategyProfile(profile);
    setCreationStep('animation');
  };

  const handleAnimationComplete = (strategyName: string) => {
    setGeneratedStrategyName(strategyName);
    
    // Generate portfolio based on profile
    setGeneratedPortfolio({
      name: strategyName,
      holdings: enhancedGeneratedHoldings,
      excluded: strategyProfile.restrictions.includes('fossil-fuels') ? excludedHoldings : [],
      strategyBreakdown: [
        { role: 'Core Equity', percentage: 35 },
        { role: 'Growth Accelerator', percentage: 20 },
        { role: 'International Diversification', percentage: 20 },
        { role: 'Stability Buffer', percentage: 15 },
        { role: 'Inflation Hedge', percentage: 10 },
      ],
      rationale: `We built this portfolio to help you ${strategyProfile.primaryGoal === 'accumulation' ? 'grow your money' : strategyProfile.primaryGoal === 'income' ? 'earn regular income' : 'protect what you have'} over ${strategyProfile.timeline} years. ${strategyProfile.riskStatement === 'maximum-growth' ? 'You said you\'re okay with bigger ups and downs to aim for higher returns, so we picked investments with more growth potential.' : strategyProfile.riskStatement === 'protect' ? 'Since protecting your money is important to you, we focused on steadier investments that won\'t swing as wildly.' : 'We balanced growth opportunities with stability, so you get a mix of investments that can grow but won\'t keep you up at night.'}`,
      risks: 'This portfolio carries moderate equity risk with exposure to technology concentration, currency risk from international holdings, and interest rate sensitivity from bonds.',
    });
    
    setCreationStep('results');
  };

  const handleStartOver = () => {
    setCreationStep('questionnaire');
    setStrategyProfile(initialProfile);
    setGeneratedPortfolio(null);
    setGeneratedStrategyName('');
  };

  const addManualRow = () => {
    setManualHoldings([...manualHoldings, { id: Date.now().toString(), ticker: '', weight: 0 }]);
  };

  const removeManualRow = (id: string) => {
    if (manualHoldings.length > 1) {
      setManualHoldings(manualHoldings.filter(h => h.id !== id));
    }
  };

  const updateManualRow = (id: string, field: 'ticker' | 'weight', value: string | number) => {
    setManualHoldings(manualHoldings.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  const totalWeight = manualHoldings.reduce((acc, h) => acc + (h.weight || 0), 0);

  const handleSave = () => {
    toast({
      title: "Portfolio saved!",
      description: "Your portfolio has been saved as a draft.",
    });
  };

  const handleRunSimulation = () => {
    navigate('/simulation/new');
  };

  // Render results content after animation completes
  const renderResultsContent = () => (
    <div className="space-y-6 animate-fade-in">
      {generatedPortfolio && (
        <>
          {/* Portfolio Header */}
          <Card className="glass-card border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{generatedPortfolio.name}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleStartOver}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start Over
                  </Button>
                  <span className="text-sm font-normal px-3 py-1 rounded-full bg-primary/20 text-primary">
                    AI Generated
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Strategy Breakdown */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Allocation Strategy
                </h4>
                <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-3">
                  {generatedPortfolio.strategyBreakdown.map((item, idx) => (
                    <div 
                      key={item.role}
                      className="relative flex items-center justify-center text-xs font-medium"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: idx === 0 ? 'hsl(var(--primary))' : 
                                       idx === 1 ? 'hsl(var(--success))' : 
                                       idx === 2 ? 'hsl(var(--accent))' : 
                                       idx === 3 ? 'hsl(var(--muted))' : 
                                       'hsl(var(--warning))',
                        color: idx === 3 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))'
                      }}
                    >
                      {item.percentage}%
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {generatedPortfolio.strategyBreakdown.map((item, idx) => (
                    <div key={item.role} className="flex items-center gap-1.5">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ 
                          backgroundColor: idx === 0 ? 'hsl(var(--primary))' : 
                                         idx === 1 ? 'hsl(var(--success))' : 
                                         idx === 2 ? 'hsl(var(--accent))' : 
                                         idx === 3 ? 'hsl(var(--muted))' : 
                                         'hsl(var(--warning))'
                        }}
                      />
                      <span className="text-muted-foreground">{item.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holdings with Explanations */}
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
                          <Badge variant="outline" className={`${roleColors[holding.role]} flex items-center gap-1`}>
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
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {char}
                              </Badge>
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

          {/* Excluded Holdings */}
          {generatedPortfolio.excluded.length > 0 && (
            <Card className="glass-card border-warning/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Why Not These Funds?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedPortfolio.excluded.map((item) => (
                    <div key={item.ticker} className="flex items-start gap-3 text-sm">
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 shrink-0">
                        {item.ticker}
                      </Badge>
                      <span className="text-muted-foreground">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Strategy Rationale */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Strategy Rationale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{generatedPortfolio.rationale}</p>
            </CardContent>
          </Card>

          {/* Key Risks */}
          <Card className="glass-card border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Key Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{generatedPortfolio.risks}</p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleRunSimulation} className="flex-1 glow-primary">
              Run Simulation
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💡 Recommended: Simulation helps you understand risk before allocating real money.
          </p>
        </>
      )}
    </div>
  );

  // Render GenAI tab content based on step
  const renderGenAIContent = () => {
    switch (creationStep) {
      case 'questionnaire':
        return (
          <ConversationalQA
            onComplete={handleQuestionnaireComplete}
            onCancel={() => navigate(-1)}
          />
        );
      
      case 'animation':
        return (
          <ParticleCrystallizationAnimation
            profile={strategyProfile}
            onComplete={handleAnimationComplete}
          />
        );
      
      case 'results':
        return renderResultsContent();
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Create Strategy</h1>
            <p className="text-muted-foreground">
              Build your investment strategy with AI assistance or manually configure holdings.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="genai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-Assisted
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="genai" className="space-y-6">
              {renderGenAIContent()}
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Portfolio Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investment Objective</Label>
                      <Select value={manualObjective} onValueChange={setManualObjective}>
                        <SelectTrigger className="bg-secondary">
                          <SelectValue placeholder="Select objective" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="low-volatility">Low Volatility</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Risk Level</Label>
                      <Select value={manualRisk} onValueChange={setManualRisk}>
                        <SelectTrigger className="bg-secondary">
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Holdings</CardTitle>
                  <Button variant="outline" size="sm" onClick={addManualRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead className="text-right">Weight (%)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualHoldings.map((holding) => (
                        <TableRow key={holding.id}>
                          <TableCell>
                            <Input
                              placeholder="e.g., VTI"
                              value={holding.ticker}
                              onChange={(e) => updateManualRow(holding.id, 'ticker', e.target.value.toUpperCase())}
                              className="bg-secondary"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={holding.weight || ''}
                              onChange={(e) => updateManualRow(holding.id, 'weight', parseFloat(e.target.value) || 0)}
                              className="bg-secondary text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeManualRow(holding.id)}
                              disabled={manualHoldings.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Weight</span>
                    <span className={totalWeight === 100 ? 'text-success' : 'text-destructive'}>
                      {totalWeight}% {totalWeight !== 100 && '(should equal 100%)'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button 
                  onClick={handleRunSimulation} 
                  className="flex-1 glow-primary"
                  disabled={totalWeight !== 100 || !manualObjective || !manualRisk}
                >
                  Run Simulation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                💡 Recommended: Simulation helps you understand risk before allocating real money.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}
