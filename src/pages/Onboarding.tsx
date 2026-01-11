import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';

type UserType = 'investor' | 'creator';

export default function Onboarding() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [objective, setObjective] = useState('');
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const [timeHorizon, setTimeHorizon] = useState('');

  const riskLabels = ['Conservative', 'Moderate', 'Aggressive'];
  const riskLabel = riskTolerance[0] < 33 ? riskLabels[0] : riskTolerance[0] < 67 ? riskLabels[1] : riskLabels[2];

  const canContinue = userType && objective && timeHorizon;

  const handleContinue = () => {
    if (userType === 'creator') {
      navigate('/create');
    } else {
      navigate('/explore');
    }
  };

  return (
    <PageLayout showDisclaimer={false}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div className="w-24 h-1 bg-border rounded-full" />
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-sm text-muted-foreground">
              2
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Welcome to MVP Investing</h1>
            <p className="text-muted-foreground">
              Let's personalize your experience in just a few steps.
            </p>
          </div>

          {/* User Type Selection */}
          <div className="space-y-4 mb-8">
            <Label className="text-base">What brings you here?</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:border-primary/50",
                  userType === 'investor' && "border-primary bg-primary/5"
                )}
                onClick={() => setUserType('investor')}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">I want to invest</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover and follow portfolios created by experts and the community.
                  </p>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:border-primary/50",
                  userType === 'creator' && "border-primary bg-primary/5"
                )}
                onClick={() => setUserType('creator')}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <PenTool className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">I want to create strategies</h3>
                  <p className="text-sm text-muted-foreground">
                    Build, simulate, and publish your own investment strategies.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Investment Preferences Form */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="objective">Investment Objective</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger id="objective" className="bg-secondary">
                  <SelectValue placeholder="Select your objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Growth - Maximize long-term returns</SelectItem>
                  <SelectItem value="income">Income - Generate regular dividends</SelectItem>
                  <SelectItem value="balanced">Balanced - Mix of growth and income</SelectItem>
                  <SelectItem value="low-volatility">Low Volatility - Minimize risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Risk Tolerance</Label>
                <span className="text-sm font-medium text-primary">{riskLabel}</span>
              </div>
              <Slider
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                max={100}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Moderate</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="horizon">Time Horizon</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                <SelectTrigger id="horizon" className="bg-secondary">
                  <SelectValue placeholder="Select time horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short-term (1-2 years)</SelectItem>
                  <SelectItem value="medium">Medium-term (3-5 years)</SelectItem>
                  <SelectItem value="long">Long-term (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-10">
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              size="lg"
              className="w-full h-14 text-lg glow-primary"
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}