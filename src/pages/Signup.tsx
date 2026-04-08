import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Mail, ArrowRight, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BackgroundOrbs } from '@/components/BackgroundOrbs';
import { supabase } from '@/integrations/supabase/client';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 6;

const LOGIN_AFTER_SIGNUP_MESSAGE =
  'Account created. Check your email to confirm, then sign in.';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  /** Full-screen state when sign-up succeeded but immediate login is blocked (email confirmation). */
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const emailTrim = email.trim();
  const emailValid = EMAIL_REGEX.test(emailTrim);
  const showEmailError =
    (emailBlurred || submitAttempted) && emailTrim !== '' && !emailValid;

  const passwordTooShort =
    submitAttempted && password.length > 0 && password.length < MIN_PASSWORD_LEN;
  const passwordsMismatch =
    submitAttempted &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!emailTrim) {
      toast({ title: 'Email required', description: 'Please enter your email.', variant: 'destructive' });
      return;
    }
    if (!emailValid) return;
    if (password.length < MIN_PASSWORD_LEN) {
      toast({
        title: 'Password too short',
        description: `Use at least ${MIN_PASSWORD_LEN} characters.`,
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Make sure both password fields match.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: emailTrim,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile-setup`,
        },
      });
      if (signUpError) {
        toast({
          title: 'Could not create account',
          description: signUpError.message || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailTrim,
        password,
      });
      if (loginError) {
        setAwaitingEmailConfirm(true);
        return;
      }

      navigate('/profile-setup', { replace: true });
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

  const goToSignIn = () => {
    navigate('/login', { state: { message: LOGIN_AFTER_SIGNUP_MESSAGE } });
  };

  if (awaitingEmailConfirm) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        <BackgroundOrbs />
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl shrink-0">
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

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-6 shrink-0" aria-hidden />
          <h1 className="text-3xl font-bold mb-3">Account created!</h1>
          <p className="text-muted-foreground max-w-md mb-10 text-base leading-relaxed">
            Check your email and click the confirmation link, then come back and sign in.
          </p>
          <Button type="button" size="lg" className="min-w-[200px]" onClick={goToSignIn}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">
              Sign up with email and password, then complete a short setup wizard.
            </p>
          </div>

          <div className="glass-card p-8">
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
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailBlurred(true)}
                    className="pl-10"
                    maxLength={255}
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
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                    aria-invalid={passwordTooShort}
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
                {passwordTooShort && (
                  <p className="text-sm text-destructive animate-in fade-in duration-200">
                    Password must be at least {MIN_PASSWORD_LEN} characters
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                    aria-invalid={passwordsMismatch}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="text-sm text-destructive animate-in fade-in duration-200">
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
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
              <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">What happens next?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  After you sign up, you&apos;ll set up your profile and investing preferences before using the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
