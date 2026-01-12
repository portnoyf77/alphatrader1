import { useState, useMemo } from 'react';
import { Info, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageLayout } from '@/components/layout/PageLayout';
import { StrategyCard } from '@/components/StrategyCard';
import { getValidatedStrategies } from '@/lib/mockData';

type LeaderboardTab = 'risk-adjusted' | 'consistent' | 'best-30d' | 'lowest-drawdown';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('risk-adjusted');
  const validatedStrategies = useMemo(() => getValidatedStrategies(), []);

  const sortedStrategies = useMemo(() => {
    const strategies = [...validatedStrategies];
    switch (activeTab) {
      case 'risk-adjusted':
        return strategies.sort((a, b) => (b.performance.return_90d / b.performance.volatility) - (a.performance.return_90d / a.performance.volatility));
      case 'consistent':
        return strategies.sort((a, b) => b.performance.consistency_score - a.performance.consistency_score);
      case 'best-30d':
        return strategies.sort((a, b) => b.performance.return_30d - a.performance.return_30d);
      case 'lowest-drawdown':
        return strategies.sort((a, b) => b.performance.max_drawdown - a.performance.max_drawdown);
      default:
        return strategies;
    }
  }, [activeTab, validatedStrategies]);

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
            <p className="text-muted-foreground">Top performing validated strategies across different metrics.</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm cursor-help">
                  <Info className="h-4 w-4 text-primary" /><span className="hidden sm:inline">How rankings work</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>Rankings include only validated strategies and emphasize consistency and drawdown control. Simulated-only strategies are not eligible.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm mb-6">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>All strategies shown have completed validation and meet performance stability criteria.</span>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardTab)}>
          <TooltipProvider delayDuration={200}>
            <TabsList className="bg-secondary mb-6 flex-wrap h-auto gap-1 p-1">
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="risk-adjusted" className="flex-1 sm:flex-none">Risk-Adjusted</TabsTrigger></TooltipTrigger><TooltipContent className="text-xs">Return divided by volatility - higher is better</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="consistent" className="flex-1 sm:flex-none">Most Consistent</TabsTrigger></TooltipTrigger><TooltipContent className="text-xs">Strategies with the most stable, predictable returns</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="best-30d" className="flex-1 sm:flex-none">Best 30-Day</TabsTrigger></TooltipTrigger><TooltipContent className="text-xs">Highest absolute returns in the last 30 days</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="lowest-drawdown" className="flex-1 sm:flex-none">Lowest Drawdown</TabsTrigger></TooltipTrigger><TooltipContent className="text-xs">Smallest peak-to-trough decline</TooltipContent></Tooltip>
            </TabsList>
          </TooltipProvider>
          <p className="text-sm text-muted-foreground mb-6">{tabDescriptions[activeTab]}</p>
          <TabsContent value={activeTab} className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedStrategies.map((strategy, index) => (
                <StrategyCard key={strategy.id} strategy={strategy} rank={index + 1} showValidationBadge />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
