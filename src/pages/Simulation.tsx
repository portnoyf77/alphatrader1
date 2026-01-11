import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Target, Share2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { MetricCard } from '@/components/MetricCard';
import { PerformanceChart } from '@/components/PerformanceChart';
import { StatusBadge } from '@/components/StatusBadge';
import { formatPercent } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

// Mock simulation data
const simulatedPortfolio = {
  name: 'Harborline Growth',
  performance: {
    return_30d: 4.2,
    return_90d: 12.8,
    max_drawdown: -8.5,
    volatility: 15.2,
    consistency_score: 78,
  }
};

export default function Simulation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handlePublish = () => {
    setShowPublishModal(false);
    toast({
      title: "Portfolio published!",
      description: "Your portfolio is now visible to other users.",
    });
    navigate('/dashboard');
  };

  const handleKeepPrivate = () => {
    toast({
      title: "Portfolio saved privately",
      description: "Only you can see this portfolio.",
    });
    navigate('/dashboard');
  };

  const { performance } = simulatedPortfolio;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{simulatedPortfolio.name}</h1>
                  <StatusBadge status="Simulated" />
                </div>
                <p className="text-muted-foreground">
                  Simulation complete. Review your portfolio's projected performance below.
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard
              label="30-Day Return"
              value={formatPercent(performance.return_30d)}
              icon={performance.return_30d >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              trend={performance.return_30d >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="90-Day Return"
              value={formatPercent(performance.return_90d)}
              icon={performance.return_90d >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              trend={performance.return_90d >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="Max Drawdown"
              value={formatPercent(performance.max_drawdown, false)}
              icon={<TrendingDown className="h-4 w-4" />}
              trend="down"
            />
            <MetricCard
              label="Volatility"
              value={formatPercent(performance.volatility, false)}
              icon={<Activity className="h-4 w-4" />}
              trend="neutral"
            />
            <MetricCard
              label="Consistency"
              value={`${performance.consistency_score}/100`}
              icon={<Target className="h-4 w-4" />}
              trend={performance.consistency_score >= 70 ? 'up' : 'neutral'}
            />
          </div>

          {/* Performance Chart */}
          <div className="mb-8">
            <PerformanceChart
              return30d={performance.return_30d}
              return90d={performance.return_90d}
              portfolioName={simulatedPortfolio.name}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setShowPublishModal(true)}
              className="flex-1 h-12 glow-primary"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Publish Portfolio
            </Button>
            <Button
              variant="outline"
              onClick={handleKeepPrivate}
              className="flex-1 h-12"
            >
              <Lock className="h-4 w-4 mr-2" />
              Keep Private
            </Button>
          </div>

          {/* Publish Modal */}
          <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Publish this strategy?</DialogTitle>
                <DialogDescription className="pt-4 space-y-3">
                  <p>
                    Published strategies can be followed by other users. If they allocate, 
                    you earn a share of platform fees.
                  </p>
                  <p>
                    You can unpublish at any time.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-3 sm:gap-3">
                <Button variant="outline" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePublish} className="glow-primary">
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout>
  );
}