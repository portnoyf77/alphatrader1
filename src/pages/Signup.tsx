import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Mail, ArrowRight, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useToast } from '@/hooks/use-toast';
import { BackgroundOrbs } from '@/components/BackgroundOrbs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'sent';

export default function Signup() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [emailSubmitAttempted, setEmailSubmitAttempted] = useState(false);
  const { signup } = useMockAuth();
  const { toast } = useToast();

  const emailTrim = email.trim();
  const emailValid = EMAIL_REGEX.test(emailTrim);
  const showEmailError =
    (emailBlurred || emailSubmitAttempted) && emailTrim !== '' && !emailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitAttempted(true);
    if (!emailTrim) {
      toast({ title: 'Email required', description: 'Please enter your email.', variant: 'destructive' });
      return;
    }
    if (!emailValid) return;

    setIsLoading(true);
    try {
      await signup(emailTrim);
      setStep('sent');
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundOrbs />
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold">Alpha Trader</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* ── Email entry ── */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground">
                  Enter your email to get started. We'll send you a sign-in link -- no password needed.
                </p>
              </div>

              <div className="glass-card p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        onBlur={() => setEmailBlurred(true)}
                        className="pl-10"
                        maxLength={255}
                        autoFocus
                        aria-invalid={showEmailError}
                      />
                    </div>
                    {showEmailError && (
                      <p className="text-sm text-destructive animate-in fade-in duration-200">
                        Please enter a valid email
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? 'Sending link...' : 'Continue'}
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
                    <p className="text-sm font-medium">What happens next?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the link in your email, then complete a quick setup wizard to personalize your trading experience.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Magic link sent ── */}
          {step === 'sent' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-3">Check your email</h1>
              <p className="text-muted-foreground mb-2">
                We sent a sign-in link to
              </p>
              <p className="text-foreground font-medium mb-6">{email}</p>
              <p className="text-sm text-muted-foreground mb-8">
                Click the link to complete your account setup.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('email');
                  setEmail('');
                }}
              >
                Use a different email
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
