import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Shield, Filter, Pause, BarChart3, Wallet, Settings, ExternalLink, Tag, AlertTriangle, Briefcase, Handshake, FlaskConical, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from '@/components/layout/PageLayout';
import { GemDot } from '@/components/GemDot';
import { formatCurrency, formatPercent, mockPortfolios } from '@/lib/mockData';
import { cn, riskDisplayLabel } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

// My portfolios (ones I created)
const myPortfolios = mockPortfolios.slice(0, 4);
// Portfolios I've invested in — hardcoded values per portfolio
const investedPortfolioData: Record<string, { myAllocation: number; myReturn: number }> = {
  '5': { myAllocation: 38000, myReturn: -4.8 },
  '6': { myAllocation: 33000, myReturn: 0.0 },
  '7': { myAllocation: 33000, myReturn: 5.0 },
};
const investedPortfolios = mockPortfolios.slice(4, 7).map(p => ({
  ...p,
  myAllocation: investedPortfolioData[p.id]?.myAllocation ?? 25000,
  myReturn: investedPortfolioData[p.id]?.myReturn ?? 0,
}));
// Simulating portfolios
const simulatingPortfolios = myPortfolios.filter(p => p.status === 'private');

// Mock user total return vs S&P 500
const userTotalReturn = 12.4;
const sp500Return = 9.8;
const vsSP500 = userTotalReturn - sp500Return;

// Mock news with thumbnail gradients per sector
const sectorGradients: Record<string, string> = {
  Financials: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f3a 100%)',
  Technology: 'linear-gradient(135deg, #3b1f6e 0%, #1a0e3a 100%)',
  'Clean Energy': 'linear-gradient(135deg, #0f4a2e 0%, #0a2618 100%)',
  Healthcare: 'linear-gradient(135deg, #134e5e 0%, #0a2a30 100%)',
  Industrial: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
};

const mockNews = [
  { headline: 'Fed Signals Potential Rate Pause in Q3', url: 'https://reuters.com', sector: 'Financials', tag: 'Relevant to your Financials holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=134&fit=crop' },
  { headline: 'NVIDIA Reports Record Data Center Revenue', url: 'https://reuters.com', sector: 'Technology', tag: 'Relevant to your Tech holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=134&fit=crop' },
  { headline: 'Renewable Energy Stocks Surge on Policy Update', url: 'https://reuters.com', sector: 'Clean Energy', tag: 'Relevant to your Clean Energy holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=134&fit=crop' },
  { headline: 'Healthcare M&A Activity Hits 2025 High', url: 'https://reuters.com', sector: 'Healthcare', tag: 'Relevant to your Healthcare holdings', thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=134&fit=crop' },
  { headline: 'Global Supply Chain Bottlenecks Easing', url: 'https://reuters.com', sector: 'Industrial', tag: 'Market-wide impact', thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=134&fit=crop' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [showOnlyValidated, setShowOnlyValidated] = useState(false);

  const filteredMyPortfolios = showOnlyValidated 
    ? myPortfolios.filter(s => s.validation_status === 'validated' && s.validation_criteria_met && s.status === 'validated_listed')
    : myPortfolios.filter(s => s.status !== 'private');

  const liveCount = myPortfolios.filter(s => s.status !== 'private').length;
  const simulatingCount = myPortfolios.filter(s => s.status === 'private').length;
  const totalMyInvestment = myPortfolios.reduce((acc, s) => acc + s.creator_investment, 0);
  const totalInvestedInOthers = investedPortfolios.reduce((acc, s) => acc + s.myAllocation, 0);
  const totalValue = totalMyInvestment + totalInvestedInOthers;

  // Count-up animations for summary bar
  const animMyInvestment = useCountUp(totalMyInvestment, 800);
  const animTotalValue = useCountUp(totalValue, 800);
  const animVsSP500 = useCountUp(vsSP500, 800, 1);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your portfolios and investments.</p>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[1.5rem] font-bold text-foreground">{formatCurrency(animMyInvestment)}</span>
            <span className="text-[0.875rem] text-[rgba(255,255,255,0.4)]">invested</span>
          </div>
          <span className="text-[rgba(255,255,255,0.15)] text-lg select-none">·</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[1.5rem] font-bold text-foreground">{formatCurrency(animTotalValue)}</span>
            <span className="text-[0.875rem] text-[rgba(255,255,255,0.4)]">total value</span>
          </div>
          <span className="text-[rgba(255,255,255,0.15)] text-lg select-none">·</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-baseline gap-1.5 cursor-help">
                  <span className={cn(
                    "font-mono text-[1.5rem] font-bold",
                    vsSP500 >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {vsSP500 >= 0 ? '+' : ''}{animVsSP500}%
                  </span>
                  <span className="text-[0.875rem] text-[rgba(255,255,255,0.4)]">vs S&P 500</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                You: {formatPercent(userTotalReturn)} · S&P: {formatPercent(sp500Return)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Tabbed Portfolio Lists — counts in tab labels */}
        <Tabs defaultValue="my-portfolios" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="my-portfolios" className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              My Portfolios ({liveCount})
            </TabsTrigger>
            <TabsTrigger value="invested" className="flex items-center gap-1.5">
              <Handshake className="h-3.5 w-3.5" />
              Invested In ({investedPortfolios.length})
            </TabsTrigger>
            <TabsTrigger value="simulating" className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              Simulating ({simulatingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-portfolios">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Portfolios I Created</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Switch id="validated-filter" checked={showOnlyValidated} onCheckedChange={setShowOnlyValidated} />
                  <Label htmlFor="validated-filter" className="text-sm text-muted-foreground cursor-pointer">Live only</Label>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-muted-foreground/40">Status</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Current portfolio status: Live, Simulating, or Inactive</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-muted-foreground/40">My Investment</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Capital you've invested in this portfolio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-muted-foreground/40">30d Return</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Portfolio return over the last 30 days</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMyPortfolios.map((portfolio) => (
                      <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/dashboard/portfolio/${portfolio.id}`)}>
                         <TableCell>
                          <Link to={`/dashboard/portfolio/${portfolio.id}`} className="font-medium hover:text-primary transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <GemDot name={portfolio.name} />
                            {portfolio.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn("px-2 py-1 rounded text-xs cursor-help", portfolio.status === 'validated_listed' ? "bg-success/20 text-success" : portfolio.status === 'inactive' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning")}>
                                  {portfolio.status === 'validated_listed' ? 'Live' : portfolio.status === 'inactive' ? 'Inactive' : 'Simulating'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[250px]">
                                {portfolio.status === 'validated_listed' ? 'This portfolio is actively invested with real capital' : portfolio.status === 'inactive' ? 'This portfolio has been liquidated and is no longer active' : 'This portfolio is running a live simulation with market data'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(portfolio.creator_investment)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("flex items-center justify-end gap-1", portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                            {portfolio.performance.return_30d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(portfolio.performance.return_30d)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invested">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Portfolios I've Invested In</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Creator</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">The Alpha who manages this portfolio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">30d Return</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Portfolio return over the last 30 days</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">My Allocation</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Capital you've allocated to this portfolio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">My Return</span></TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[250px]">Your return since you started following this portfolio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investedPortfolios.map((portfolio) => (
                      <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Link to={`/portfolio/${portfolio.id}`} state={{ from: 'dashboard' }} className="font-medium hover:text-primary transition-colors flex items-center gap-2">
                              <GemDot name={portfolio.name} />
                              {portfolio.name}
                            </Link>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive/70 shrink-0 hover:animate-[subtle-pulse_0.6s_ease] cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs max-w-[240px]">
                                  If this Alpha exits their position, your allocation will automatically follow. You may receive less than your initial investment.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{portfolio.creator_id}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("flex items-center justify-end gap-1", (portfolio.performance?.return_30d ?? 0) >= 0 ? "text-success" : "text-destructive")}>
                            {(portfolio.performance?.return_30d ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(portfolio.performance?.return_30d ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(portfolio.myAllocation)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("flex items-center justify-end gap-1", portfolio.myReturn >= 0 ? "text-success" : "text-destructive")}>
                            {portfolio.myReturn >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(portfolio.myReturn)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulating">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Portfolios in Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                {simulatingPortfolios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">No portfolios currently simulating.</p>
                    <Link to="/invest" className="text-primary hover:underline text-sm">Create a new portfolio →</Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                       <TableRow>
                        <TableHead>Portfolio</TableHead>
                        <TableHead>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Sim. Duration</span></TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[250px]">Number of days this simulation has been running</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead className="text-right">
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Sim. Return</span></TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[250px]">Simulated return since simulation started</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead className="text-right">
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Worst Drop</span></TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[250px]">Largest peak-to-trough decline during simulation</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead className="text-right">
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild><span className="cursor-help border-b border-dashed border-muted-foreground/40">Risk Level</span></TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[250px]">Portfolio risk classification: Conservative, Moderate, or Aggressive</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulatingPortfolios.map((portfolio) => (
                        <TableRow key={portfolio.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/simulation/${portfolio.id}`)}>
                          <TableCell>
                            <Link to={`/simulation/${portfolio.id}`} className="font-medium hover:text-primary transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <GemDot name={portfolio.name} />
                              {portfolio.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            19 days
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn("flex items-center justify-end gap-1", portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                              {portfolio.performance.return_30d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {formatPercent(portfolio.performance.return_30d)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const dd = Math.abs(portfolio.performance.max_drawdown);
                              const color = dd >= 20 ? '#EF4444' : dd >= 18 ? '#F97316' : dd >= 15 ? '#F59E0B' : undefined;
                              return <span style={color ? { color } : undefined}>{formatPercent(portfolio.performance.max_drawdown, false)}</span>;
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn("px-2 py-1 rounded text-xs",
                              portfolio.risk_level === 'Low' ? "bg-success/20 text-success" :
                              portfolio.risk_level === 'Medium' ? "bg-warning/20 text-warning" :
                              "bg-destructive/20 text-destructive"
                            )}>
                              {riskDisplayLabel(portfolio.risk_level)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right w-8">
                            <ChevronRight size={16} className="text-muted-foreground/30" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Market News — horizontal card tiles */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Market News</h2>
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`.news-scroll::-webkit-scrollbar { display: none; }`}</style>
            {mockNews.map((news, i) => (
              <a
                key={i}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-scroll group flex-shrink-0 w-[200px] rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Thumbnail */}
                <div
                  className="w-full h-[120px] overflow-hidden"
                  style={{
                    borderRadius: '12px 12px 0 0',
                    background: sectorGradients[news.sector] || sectorGradients.Industrial,
                  }}
                >
                  <img
                    src={news.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                {/* Text content */}
                <div className="p-3">
                  <p
                    className="text-[0.85rem] font-semibold text-foreground leading-snug group-hover:text-white transition-colors"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {news.headline}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Tag className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[0.75rem] text-primary/80 truncate">{news.tag}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
