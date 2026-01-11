import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wrench, Plus, Trash2, Loader2, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';

interface HoldingRow {
  id: string;
  ticker: string;
  weight: number;
}

const portfolioNames = [
  'Harborline Growth', 'Cedar Peak Balanced', 'Apex Momentum', 'Evergreen Value',
  'Summit Capital', 'Ridgeline Income', 'Horizon Alpha', 'Cascade Diversified'
];

const generatedHoldings = [
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 35 },
  { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 20 },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', weight: 20 },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 15 },
  { ticker: 'GLD', name: 'SPDR Gold Shares', weight: 10 },
];

export default function Create() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('genai');
  
  // GenAI state
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<{
    name: string;
    holdings: typeof generatedHoldings;
    rationale: string;
    risks: string;
  } | null>(null);

  // Manual state
  const [manualHoldings, setManualHoldings] = useState<HoldingRow[]>([
    { id: '1', ticker: '', weight: 0 }
  ]);
  const [manualObjective, setManualObjective] = useState('');
  const [manualRisk, setManualRisk] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const randomName = portfolioNames[Math.floor(Math.random() * portfolioNames.length)];
    
    setGeneratedPortfolio({
      name: randomName,
      holdings: generatedHoldings,
      rationale: `Based on your request for "${prompt.slice(0, 50)}...", this portfolio balances growth potential with risk management. The allocation emphasizes broad market exposure through VTI while adding international diversification via VXUS. QQQ provides targeted technology exposure for growth, while BND and GLD serve as stabilizers during market volatility.`,
      risks: 'This portfolio has moderate exposure to equity market risk. Technology concentration through QQQ may amplify drawdowns during tech corrections. International holdings add currency risk. Bond holdings are sensitive to interest rate changes.',
    });
    
    setIsGenerating(false);
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
    // In a real app, we'd pass the portfolio data
    navigate('/simulation/new');
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Portfolio</h1>
            <p className="text-muted-foreground">
              Build a new portfolio using AI assistance or manual selection.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="genai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                GenAI
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Wrench className="h-4 w-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            {/* GenAI Tab */}
            <TabsContent value="genai" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Describe Your Investment Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">What do you want your portfolio to achieve?</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., Growth portfolio, medium risk, avoid fossil fuels, include some international exposure. Focus on tech and healthcare sectors."
                      className="mt-2 min-h-[120px] bg-secondary"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleGenerate} 
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating portfolio...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Portfolio
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Output */}
              {generatedPortfolio && (
                <div className="space-y-6 animate-fade-in">
                  <Card className="glass-card border-primary/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{generatedPortfolio.name}</span>
                        <span className="text-sm font-normal px-3 py-1 rounded-full bg-primary/20 text-primary">
                          AI Generated
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Holdings Table */}
                      <div>
                        <h4 className="font-medium mb-3">Suggested Holdings</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ticker</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="text-right">Weight</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {generatedPortfolio.holdings.map((holding) => (
                              <TableRow key={holding.ticker}>
                                <TableCell className="font-medium">{holding.ticker}</TableCell>
                                <TableCell className="text-muted-foreground">{holding.name}</TableCell>
                                <TableCell className="text-right">{holding.weight}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Rationale */}
                      <div>
                        <h4 className="font-medium mb-2">Strategy Rationale</h4>
                        <p className="text-sm text-muted-foreground">{generatedPortfolio.rationale}</p>
                      </div>

                      {/* Risks */}
                      <div>
                        <h4 className="font-medium mb-2">Key Risks</h4>
                        <p className="text-sm text-muted-foreground">{generatedPortfolio.risks}</p>
                      </div>
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
                </div>
              )}
            </TabsContent>

            {/* Manual Tab */}
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