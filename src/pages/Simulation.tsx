import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Target, Share2, Lock, CheckCircle2, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { MetricCard } from '@/components/MetricCard';
import { PerformanceChart } from '@/components/PerformanceChart';
import { StatusBadge } from '@/components/StatusBadge';
import { ValidationBadge } from '@/components/ValidationBadge';
import { formatPercent } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import type { ValidationStatus } from '@/lib/types';

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

type ValidationState = 'pending' | 'submitting' | 'in_progress' | 'validated';

export default function Simulation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('pending');

  const handleSubmitForValidation = async () => {
    setValidationState('submitting');
    
    // Simulate validation submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setValidationState('in_progress');
    
    // Simulate validation completion after delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    setValidationState('validated');
    
    toast({
      title: "Validation complete!",
      description: "Your strategy has passed validation and can now be published.",
    });
  };

  const handlePublish = () => {
    setShowPublishModal(false);
    toast({
      title: "Portfolio published!",
      description: "Your portfolio is now visible to other users in the marketplace.",
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

  const getValidationStatus = (): ValidationStatus => {
    if (validationState === 'validated') return 'validated';
    if (validationState === 'in_progress') return 'in_validation';
    return 'simulated';
  };

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
                  <ValidationBadge status={getValidationStatus()} />
                </div>
                <p className="text-muted-foreground">
                  Simulation complete. Review your portfolio's projected performance below.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Status Card */}
          <Card className={`mb-8 ${
            validationState === 'validated' 
              ? 'border-success/50 bg-success/5' 
              : validationState === 'in_progress' 
                ? 'border-warning/50 bg-warning/5'
                : 'border-muted'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {validationState === 'validated' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : validationState === 'in_progress' || validationState === 'submitting' ? (
                  <Clock className="h-5 w-5 text-warning" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                )}
                Validation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationState === 'pending' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-sm font-medium">
                      Not Validated
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This strategy must complete validation before it can be published to the marketplace.
                    Validation evaluates stability and risk behavior to ensure quality strategies for investors.
                  </p>
                  <Button onClick={handleSubmitForValidation} className="glow-primary">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit for Validation
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Validation evaluates consistency, drawdown, and volatility vs benchmarks.
                  </p>
                </>
              )}

              {validationState === 'submitting' && (
                <>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Submitting for validation...</span>
                  </div>
                </>
              )}

              {validationState === 'in_progress' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-warning/20 text-warning text-sm font-medium">
                      Validation in Progress
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Evaluating consistency, drawdown, and volatility vs benchmarks.
                    This typically takes a few moments...
                  </p>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-warning" />
                    <span className="text-sm text-muted-foreground">Processing validation criteria...</span>
                  </div>
                </>
              )}

              {validationState === 'validated' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-success/20 text-success text-sm font-medium">
                      Validated
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Validated after simulation with stable drawdown profile and consistent risk-adjusted returns.
                    Your strategy is now eligible for marketplace listing.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

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
              disabled={validationState !== 'validated'}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {validationState === 'validated' ? 'Publish to Marketplace' : 'Publish (Validation Required)'}
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

          {validationState !== 'validated' && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              ⚠️ You must complete validation before publishing to the marketplace.
            </p>
          )}

          {/* Publish Modal */}
          <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Publish this strategy?</DialogTitle>
                <DialogDescription className="pt-4 space-y-3">
                  <p>
                    Your strategy has been validated and can now be published to the marketplace.
                    Other investors will be able to discover and invest in this strategy.
                  </p>
                  <p>
                    If they allocate, you earn a share of platform fees.
                    You can unpublish at any time.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-3 sm:gap-3">
                <Button variant="outline" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePublish} className="glow-primary">
                  Publish to Marketplace
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout>
  );
}
