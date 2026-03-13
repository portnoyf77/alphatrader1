import { Target, Clock, Wallet, ShieldAlert, BarChart3, Globe, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  StrategyProfile, 
  deriveRiskLevel, 
  deriveGeoFocus, 
  deriveGemstone,
  questions 
} from '@/lib/strategyProfile';
import { cn } from '@/lib/utils';

interface ProfileSummaryProps {
  profile: StrategyProfile;
  onGenerate: () => void;
  onBack: () => void;
}

export function ProfileSummary({ profile, onGenerate, onBack }: ProfileSummaryProps) {
  const riskLevel = deriveRiskLevel(profile);
  const geoFocus = deriveGeoFocus(profile);
  const gemstone = deriveGemstone(profile);

  const getOptionLabel = (questionId: keyof StrategyProfile, value: string | null) => {
    if (!value) return 'Not specified';
    const question = questions.find(q => q.id === questionId);
    const option = question?.options?.find(o => o.value === value);
    return option?.label || value;
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'Low': return 'text-success';
      case 'Medium': return 'text-warning';
      case 'High': return 'text-destructive';
    }
  };

  const summaryItems = [
    {
      icon: Target,
      label: 'Primary Goal',
      value: getOptionLabel('primaryGoal', profile.primaryGoal),
    },
    {
      icon: Clock,
      label: 'Investment Timeline',
      value: profile.timeline ? `${profile.timeline} years` : 'Not specified',
    },
    {
      icon: Wallet,
      label: 'Financial Situation',
      value: getOptionLabel('financialSituation', profile.financialSituation),
    },
    {
      icon: ShieldAlert,
      label: 'Risk Tolerance',
      value: `${profile.volatilityTolerance}% volatility`,
    },
    {
      icon: Globe,
      label: 'Geographic Focus',
      value: geoFocus,
    },
    {
      icon: Settings,
      label: 'Management Style',
      value: getOptionLabel('managementApproach', profile.managementApproach),
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Your Strategy Profile
        </h2>
        <p className="text-muted-foreground text-lg">
          Review your preferences before we create your strategy
        </p>
      </div>

      {/* Derived Results */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="glass-card text-center p-4">
          <p className="text-sm text-muted-foreground mb-1">Risk Profile</p>
          <p className={cn('text-xl font-bold', getRiskColor())}>{riskDisplayLabel(riskLevel)}</p>
        </Card>
        <Card className="glass-card text-center p-4">
          <p className="text-sm text-muted-foreground mb-1">Strategy Type</p>
          <p className="text-xl font-bold gradient-text">{gemstone}</p>
        </Card>
        <Card className="glass-card text-center p-4">
          <p className="text-sm text-muted-foreground mb-1">Focus</p>
          <p className="text-xl font-bold text-foreground">{geoFocus}</p>
        </Card>
      </div>

      {/* Summary Details */}
      <Card className="glass-card mb-8">
        <CardContent className="p-6">
          <div className="grid gap-4">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Sector Emphasis */}
          {profile.sectorEmphasis.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Sector Emphasis</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.sectorEmphasis.map((sector) => (
                  <Badge key={sector} variant="secondary">
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Restrictions */}
          {profile.restrictions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Exclusions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.restrictions.map((restriction) => (
                  <Badge key={restriction} variant="outline" className="border-destructive/50 text-destructive">
                    {restriction.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Initial Investment */}
          {profile.initialInvestment && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Initial Investment</span>
                </div>
                <span className="font-medium text-foreground">
                  ${profile.initialInvestment.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Edit
        </Button>
        <Button onClick={onGenerate} className="flex-1 gap-2">
          <Sparkles className="w-4 h-4" />
          Generate My Strategy
        </Button>
      </div>
    </div>
  );
}
