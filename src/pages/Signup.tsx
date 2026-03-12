import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Lock, ArrowRight, User, Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Step = 'credentials' | 'plan';

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

export default function Signup() {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useMockAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    if (email.trim().length > 255) {
      toast({ title: 'Invalid email', description: 'Email is too long.', variant: 'destructive' });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      toast({ title: 'Invalid password', description: 'Password must be 6–128 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: 'Please make sure your passwords match.', variant: 'destructive' });
      return;
    }
    setStep('plan');
  };

  const handleFinalSubmit = async () => {
    if (!selectedPlan) {
      toast({ title: 'Select a plan', description: 'Please choose a plan to continue.', variant: 'destructive' });
      return;
    }
    if (!disclaimerAccepted) {
      toast({ title: 'Disclaimer required', description: 'You must accept the disclaimer to proceed.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await signup(email.trim(), password);
      toast({ title: 'Account created!', description: 'Welcome to Alpha Trader. Your unique ID has been assigned.' });
      navigate('/dashboard', { replace: true });
    } catch {
      toast({ title: 'Signup failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold">Alpha Trader</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium",
              step === 'credentials' ? "text-primary" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                step === 'credentials' ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
              )}>
                {step === 'plan' ? <Check className="h-4 w-4" /> : '1'}
              </div>
              Account
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium",
              step === 'plan' ? "text-primary" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                step === 'plan' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                2
              </div>
              Plan
            </div>
          </div>

          {step === 'credentials' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground">
                  Join Alpha Trader and start building your portfolio
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-8">
                <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        maxLength={128}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        maxLength={128}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">Already have an account? </span>
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Privacy-first identity</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll be assigned an anonymous ID (e.g., @inv_7x2k) to protect your privacy while trading.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'plan' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Choose your plan</h1>
                <p className="text-muted-foreground">
                  Both plans include a 7-day free trial. Cancel anytime.
                </p>
              </div>

              <div className="space-y-4">
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
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            isSelected ? "bg-primary/20" : "bg-secondary"
                          )}>
                            <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-1">
                              <h3 className="font-semibold text-lg">{plan.name}</h3>
                              <div className="text-right">
                                <span className="text-2xl font-bold">{plan.price}</span>
                                <span className="text-sm text-muted-foreground">{plan.period}</span>
                              </div>
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20 mb-3">
                              7-day free trial
                            </div>
                            <ul className="space-y-2">
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

              {/* Disclaimer checkbox */}
              <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="disclaimer"
                    checked={disclaimerAccepted}
                    onCheckedChange={(checked) => setDisclaimerAccepted(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="disclaimer" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    I understand that Alpha Trader is not a registered investment adviser. This platform is for informational and educational purposes only. Past performance does not guarantee future results.
                  </Label>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep('credentials')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  className="flex-1"
                  size="lg"
                  disabled={isLoading || !selectedPlan || !disclaimerAccepted}
                >
                  {isLoading ? 'Creating account...' : 'Start Free Trial'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                No credit card required. Cancel anytime during your trial.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
