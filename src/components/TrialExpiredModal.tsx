import { useState } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$19.99',
    period: '/month',
    icon: Sparkles,
    features: [
      'Unlimited AI portfolio creation',
      'Live simulations',
      'Marketplace access',
      'Auto-rebalancing with notifications',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49.99',
    period: '/month',
    icon: Crown,
    popular: true,
    features: [
      'Everything in Basic',
      'Advanced risk analytics (volatility, stress testing, correlation)',
      'Priority marketplace access',
      'Downloadable tax reports',
    ],
  },
] as const;

export function TrialExpiredModal() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { selectPlan } = useMockAuth();
  const { toast } = useToast();

  const handleSelectPlan = () => {
    if (!selectedPlan) return;
    selectPlan(selectedPlan);
    toast({
      title: 'Plan activated!',
      description: `You're now on the ${selectedPlan === 'pro' ? 'Pro' : 'Basic'} plan.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 glass-card rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Your free trial has ended</h1>
          <p className="text-muted-foreground">
            Choose a plan to continue using Alpha Trader's full features.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 relative overflow-hidden",
                  isSelected
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border/50 hover:border-primary/40"
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {'popular' in plan && plan.popular && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary/20" : "bg-secondary"
                    )}>
                      <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-2">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <div className="text-right">
                          <span className="text-2xl font-bold">{plan.price}</span>
                          <span className="text-sm text-muted-foreground">{plan.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={handleSelectPlan}
          disabled={!selectedPlan}
          className="w-full"
          size="lg"
        >
          Activate Plan
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          You can still browse the marketplace without a plan.
        </p>
      </div>
    </div>
  );
}