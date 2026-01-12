import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageLayout } from '@/components/layout/PageLayout';
import { PortfolioCard } from '@/components/PortfolioCard';
import { getValidatedPortfolios } from '@/lib/mockData';

type ObjectiveFilter = 'all' | 'Growth' | 'Income' | 'Balanced' | 'Low volatility';
type RiskFilter = 'all' | 'Low' | 'Medium' | 'High';
type StrategyFilter = 'all' | 'GenAI' | 'Manual';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('all');

  // Only show validated portfolios in marketplace
  const validatedPortfolios = useMemo(() => getValidatedPortfolios(), []);

  const filteredPortfolios = useMemo(() => {
    return validatedPortfolios.filter(portfolio => {
      const matchesSearch = portfolio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        portfolio.creator_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesObjective = objectiveFilter === 'all' || portfolio.objective === objectiveFilter;
      const matchesRisk = riskFilter === 'all' || portfolio.risk_level === riskFilter;
      const matchesStrategy = strategyFilter === 'all' || portfolio.strategy_type === strategyFilter;

      return matchesSearch && matchesObjective && matchesRisk && matchesStrategy;
    });
  }, [validatedPortfolios, searchQuery, objectiveFilter, riskFilter, strategyFilter]);

  const hasActiveFilters = objectiveFilter !== 'all' || 
    riskFilter !== 'all' || strategyFilter !== 'all';

  const clearFilters = () => {
    setObjectiveFilter('all');
    setRiskFilter('all');
    setStrategyFilter('all');
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Objective</label>
        <Select value={objectiveFilter} onValueChange={(v) => setObjectiveFilter(v as ObjectiveFilter)}>
          <SelectTrigger className="bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Objectives</SelectItem>
            <SelectItem value="Growth">Growth</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Balanced">Balanced</SelectItem>
            <SelectItem value="Low volatility">Low Volatility</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Risk Level</label>
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
          <SelectTrigger className="bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Strategy Type</label>
        <Select value={strategyFilter} onValueChange={(v) => setStrategyFilter(v as StrategyFilter)}>
          <SelectTrigger className="bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="GenAI">GenAI</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Portfolios</h1>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
              <CheckCircle2 className="h-4 w-4" />
              All strategies listed here have completed validation and meet performance stability criteria.
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">
                    Only validated strategies appear here. Strategies must complete a validation period demonstrating consistent performance before being publicly listed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search portfolios or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-3">
            <Select value={objectiveFilter} onValueChange={(v) => setObjectiveFilter(v as ObjectiveFilter)}>
              <SelectTrigger className="w-[150px] bg-secondary">
                <SelectValue placeholder="Objective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Objectives</SelectItem>
                <SelectItem value="Growth">Growth</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Balanced">Balanced</SelectItem>
                <SelectItem value="Low volatility">Low Volatility</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
              <SelectTrigger className="w-[140px] bg-secondary">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={strategyFilter} onValueChange={(v) => setStrategyFilter(v as StrategyFilter)}>
              <SelectTrigger className="w-[140px] bg-secondary">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="GenAI">GenAI</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} size="icon">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      !
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Results */}
        {filteredPortfolios.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} showValidationBadge />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No portfolios match your filters.</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
