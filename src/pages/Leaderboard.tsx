import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageLayout } from '@/components/layout/PageLayout';
import { PortfolioCard } from '@/components/PortfolioCard';
import { mockPortfolios } from '@/lib/mockData';

type LeaderboardTab = 'risk-adjusted' | 'consistent' | 'best-30d' | 'lowest-drawdown';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('risk-adjusted');

  const sortedPortfolios = useMemo(() => {
    const portfolios = [...mockPortfolios];
    
    switch (activeTab) {
      case 'risk-adjusted':
        // Sharpe-like ratio: return / volatility
        return portfolios.sort((a, b) => {
          const ratioA = a.performance.return_90d / a.performance.volatility;
          const ratioB = b.performance.return_90d / b.performance.volatility;
          return ratioB - ratioA;
        });
      case 'consistent':
        return portfolios.sort((a, b) => 
          b.performance.consistency_score - a.performance.consistency_score
        );
      case 'best-30d':
        return portfolios.sort((a, b) => 
          b.performance.return_30d - a.performance.return_30d
        );
      case 'lowest-drawdown':
        return portfolios.sort((a, b) => 
          b.performance.max_drawdown - a.performance.max_drawdown // Less negative = better
        );
      default:
        return portfolios;
    }
  }, [activeTab]);

  const tabDescriptions: Record<LeaderboardTab, string> = {
    'risk-adjusted': 'Ranked by risk-adjusted returns (return / volatility ratio)',
    'consistent': 'Ranked by consistency score, measuring stable performance over time',
    'best-30d': 'Ranked by absolute 30-day returns',
    'lowest-drawdown': 'Ranked by smallest maximum drawdown (least loss from peak)',
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">
              Top performing portfolios across different metrics.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm cursor-help">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="hidden sm:inline">How rankings work</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>
                  Leaderboards emphasize consistency and risk controls, not just short-term returns. 
                  This helps identify sustainable strategies over those with unsustainable risks.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardTab)}>
          <TabsList className="bg-secondary mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="risk-adjusted" className="flex-1 sm:flex-none">
              Risk-Adjusted
            </TabsTrigger>
            <TabsTrigger value="consistent" className="flex-1 sm:flex-none">
              Most Consistent
            </TabsTrigger>
            <TabsTrigger value="best-30d" className="flex-1 sm:flex-none">
              Best 30-Day
            </TabsTrigger>
            <TabsTrigger value="lowest-drawdown" className="flex-1 sm:flex-none">
              Lowest Drawdown
            </TabsTrigger>
          </TabsList>

          <p className="text-sm text-muted-foreground mb-6">
            {tabDescriptions[activeTab]}
          </p>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPortfolios.map((portfolio, index) => (
                <PortfolioCard 
                  key={portfolio.id} 
                  portfolio={portfolio} 
                  rank={index + 1}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}