import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Crown, Mail, ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackgroundOrbs } from '@/components/BackgroundOrbs';
import { Label } from '@/components/ui/label';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { AuthError } from '@supabase/supabase-js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginLocationState = { message?: string };

function isEmailNotConfirmedError(error: unknown): boolean {
  const err = error as AuthError | undefined;
  if (!err) return false;
  const code = err.code?.toLowerCase() || '';
  if (code === 'email_not_confirmed') return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('email not confirmed') || msg.includes('not confirmed');
}

function loginErrorMessage(error: unknown): string {
  if (isEmailNotConfirmedError(error)) {
    return 'Please confirm your email first';
  }
  return 'Invalid email or password';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const { login } = useMockAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as LoginLocationState | null;
    if (state?.message) {
      setBannerMessage(state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const emailTrim = email.trim();
  const emailValid = EMAIL_REGEX.test(emailTrim);
  const showEmailError =
    (emailBlurred || submitAttempted) && emailTrim !== '' && !emailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setAuthError(null);
    if (!emailTrim) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    if (!emailValid) return;
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter your password.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await login(emailTrim, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setAuthError(loginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundOrbs />
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to Alpha Trader</h1>
            <p className="text-muted-foreground">Sign in with your email and password.</p>
          </div>

          {bannerMessage && (
            <div
              className="mb-6 flex gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
              role="status"
            >
              <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
              <p className="text-left leading-relaxed">{bannerMessage}</p>
            </div>
          )}

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAuthError(null);
                    }}
                    onBlur={() => setEmailBlurred(true)}
                    className="pl-10"
                    autoComplete="email"
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAuthError(null);
                    }}
                    className="pr-10"
                    autoComplete="current-password"
                    aria-invalid={!!authError}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {authError && (
                  <p className="text-sm text-destructive animate-in fade-in duration-200" role="alert">
                    {authError}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">New here? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
