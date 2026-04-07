import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMockAuth, type OnboardingData } from '@/contexts/MockAuthContext';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  'Personal Info',
  'Investor Profile',
  'Goals',
  'Plan',
  'Agreements',
] as const;

const PLAN_OPTIONS = [
  {
    id: 'basic' as const,
    name: 'Basic',
    price: '$19.99',
    period: '/month',
    features: [
      'Unlimited AI portfolio creation',
      'Live simulations',
      'Marketplace access',
      'Auto-rebalancing with notifications',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$49.99',
    period: '/month',
    features: [
      'Everything in Basic',
      'Advanced risk analytics (volatility, stress testing, correlation)',
      'Priority marketplace access',
      'Downloadable tax reports',
    ],
  },
] as const;

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Other',
] as const;

const EMPLOYMENT = [
  'Employed',
  'Self-Employed',
  'Retired',
  'Student',
  'Unemployed',
] as const;

const INCOME = [
  'Under $25k',
  '$25k-$50k',
  '$50k-$100k',
  '$100k-$250k',
  '$250k-$500k',
  'Over $500k',
] as const;

const NET_WORTH = [
  'Under $50k',
  '$50k-$100k',
  '$100k-$500k',
  '$500k-$1M',
  'Over $1M',
] as const;

const EXPERIENCE = [
  'None',
  'Beginner (< 1 year)',
  'Intermediate (1-5 years)',
  'Advanced (5+ years)',
  'Professional',
] as const;

const FUNDS_SOURCE = [
  'Employment Income',
  'Savings',
  'Inheritance',
  'Investment Returns',
  'Business Income',
  'Other',
] as const;

const GOAL_CARDS: {
  value: string;
  title: string;
  emoji: string;
  desc: string;
}[] = [
  {
    value: 'Growth',
    title: 'Growth',
    emoji: '📈',
    desc: 'Maximize long-term capital appreciation',
  },
  {
    value: 'Income',
    title: 'Income',
    emoji: '💰',
    desc: 'Generate regular dividend/interest income',
  },
  {
    value: 'Preservation',
    title: 'Preservation',
    emoji: '🛡️',
    desc: 'Protect capital with minimal risk',
  },
];

const HORIZON_CARDS: { value: string; title: string; desc: string }[] = [
  { value: 'Short-term (< 1 year)', title: 'Short-term', desc: '< 1 year' },
  { value: 'Medium-term (1-5 years)', title: 'Medium-term', desc: '1–5 years' },
  { value: 'Long-term (5+ years)', title: 'Long-term', desc: '5+ years' },
];

const RISK_CARDS: { value: string; title: string }[] = [
  { value: 'Conservative', title: 'Conservative' },
  { value: 'Moderate', title: 'Moderate' },
  { value: 'Aggressive', title: 'Aggressive' },
];

const initialForm: OnboardingData = {
  displayName: '',
  username: '',
  phone: '',
  dateOfBirth: '',
  country: '',
  employmentStatus: '',
  annualIncome: '',
  netWorth: '',
  investmentExperience: '',
  sourceOfFunds: '',
  investmentGoal: '',
  timeHorizon: '',
  riskTolerance: '',
};

const inputClass =
  'w-full px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors';

const selectClass = `${inputClass} cursor-pointer appearance-none bg-[rgba(255,255,255,0.05)]`;

const cardShell =
  'rounded-xl border p-4 text-left transition-all cursor-pointer';

export default function ProfileSetup() {
  const { user, completeOnboarding, selectPlan } = useMockAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<OnboardingData>(initialForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [agreements, setAgreements] = useState({
    terms: false,
    risk: false,
    comms: false,
  });

  const sanitizeUsername = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

  const updateField = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const checkUsername = useCallback(
    async (clean: string) => {
      if (clean.length < 3) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('checking');
      try {
        const { data, error: fetchErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', clean)
          .maybeSingle();

        if (fetchErr) {
          setUsernameStatus('idle');
          return;
        }
        if (!data || data.id === user?.id) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
        }
      } catch {
        setUsernameStatus('idle');
      }
    },
    [user?.id]
  );

  useEffect(() => {
    const clean = formData.username;
    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    const t = window.setTimeout(() => {
      void checkUsername(clean);
    }, 350);
    return () => window.clearTimeout(t);
  }, [formData.username, checkUsername]);

  const step0Valid =
    formData.displayName.trim().length >= 2 &&
    formData.username.length >= 3 &&
    usernameStatus === 'available' &&
    !!formData.country?.trim();

  const step1Valid = true;

  const step2Valid =
    !!formData.investmentGoal &&
    !!formData.timeHorizon &&
    !!formData.riskTolerance;

  const stepPlanValid = selectedPlan.trim().length > 0;

  const agreementsValid =
    agreements.terms && agreements.risk && agreements.comms;

  const canContinue = (() => {
    switch (currentStep) {
      case 0:
        return step0Valid;
      case 1:
        return step1Valid;
      case 2:
        return step2Valid;
      case 3:
        return stepPlanValid;
      default:
        return false;
    }
  })();

  const handleUsernameChange = (raw: string) => {
    const clean = sanitizeUsername(raw);
    updateField('username', clean);
    setSubmitError('');
  };

  const goNext = () => {
    if (currentStep < 4 && canContinue) {
      setCurrentStep((s) => s + 1);
      setSubmitError('');
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setSubmitError('');
    } else {
      navigate(-1);
    }
  };

  const handleComplete = async () => {
    if (!agreementsValid || saving || !stepPlanValid) return;
    setSaving(true);
    setSubmitError('');
    try {
      selectPlan(selectedPlan);
      await completeOnboarding(formData);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setSubmitError(message);
      setSaving(false);
    }
  };

  const primaryBtn =
    'inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white';
  const primaryBtnStyle = (enabled: boolean): CSSProperties => ({
    background: enabled
      ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
      : 'rgba(124, 58, 237, 0.3)',
    boxShadow: enabled ? '0 4px 16px rgba(124, 58, 237, 0.3)' : 'none',
  });

  const selectedCardStyle = (selected: boolean): CSSProperties =>
    selected
      ? {
          borderColor: '#7C3AED',
          background: 'rgba(124, 58, 237, 0.12)',
          boxShadow: '0 0 0 1px rgba(124, 58, 237, 0.35)',
        }
      : {
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.02)',
        };

  const planCardStyle = (selected: boolean): CSSProperties =>
    selected
      ? {
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid #7C3AED',
          boxShadow: '0 0 20px rgba(124, 58, 237, 0.15)',
        }
      : {
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
        };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: '#050508' }}
    >
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-white">Alpha Trader</span>
        </div>

        {/* Progress */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="relative flex items-start justify-between gap-1 px-1">
            <div
              className="pointer-events-none absolute left-[12%] right-[12%] top-4 h-0.5 rounded-full bg-[rgba(255,255,255,0.1)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-[12%] top-4 h-0.5 rounded-full bg-[#7C3AED] transition-all duration-300"
              style={{
                width:
                  currentStep === 0
                    ? '0%'
                    : `${((currentStep / (STEPS.length - 1)) * 76).toFixed(1)}%`,
                opacity: currentStep === 0 ? 0 : 0.85,
              }}
              aria-hidden
            />
            {STEPS.map((label, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={label} className="relative z-10 flex flex-col items-center flex-1 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                    style={{
                      background: done || active ? '#7C3AED' : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      border:
                        active && !done
                          ? '2px solid rgba(255,255,255,0.35)'
                          : '2px solid transparent',
                    }}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className="mt-2 text-[10px] sm:text-xs text-center font-medium leading-tight"
                    style={{
                      color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {currentStep === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Personal info</h1>
                <p className="text-sm text-muted-foreground">
                  Tell us a bit about yourself.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Full Name<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  placeholder="First and last name"
                  maxLength={80}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Username<span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="your_username"
                    maxLength={20}
                    className={`${inputClass} pl-8 pr-10 font-mono text-sm`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                    {usernameStatus === 'taken' && (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
                <div className="mt-1.5 text-xs">
                  {usernameStatus === 'taken' && (
                    <span className="text-red-400">This username is already taken</span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-emerald-400">Username available</span>
                  )}
                  {usernameStatus === 'idle' &&
                    formData.username.length > 0 &&
                    formData.username.length < 3 && (
                      <span className="text-muted-foreground">At least 3 characters</span>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone ?? ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 ..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth ?? ''}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Country<span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={formData.country ?? ''}
                  onChange={(e) => updateField('country', e.target.value)}
                  className={selectClass}
                >
                  <option value="" className="bg-[#12121a] text-white">
                    Select country
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} className="bg-[#12121a] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Investor profile</h1>
                <p className="text-sm text-muted-foreground">
                  Regulatory-friendly investor information.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Employment Status
                </label>
                <select
                  value={formData.employmentStatus ?? ''}
                  onChange={(e) => updateField('employmentStatus', e.target.value)}
                  className={selectClass}
                >
                  <option value="" className="bg-[#12121a] text-white">
                    Select
                  </option>
                  {EMPLOYMENT.map((o) => (
                    <option key={o} value={o} className="bg-[#12121a] text-white">
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Annual Income
                </label>
                <select
                  value={formData.annualIncome ?? ''}
                  onChange={(e) => updateField('annualIncome', e.target.value)}
                  className={selectClass}
                >
                  <option value="" className="bg-[#12121a] text-white">
                    Select
                  </option>
                  {INCOME.map((o) => (
                    <option key={o} value={o} className="bg-[#12121a] text-white">
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Net Worth
                </label>
                <select
                  value={formData.netWorth ?? ''}
                  onChange={(e) => updateField('netWorth', e.target.value)}
                  className={selectClass}
                >
                  <option value="" className="bg-[#12121a] text-white">
                    Select
                  </option>
                  {NET_WORTH.map((o) => (
                    <option key={o} value={o} className="bg-[#12121a] text-white">
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Investment Experience
                </label>
                <select
                  value={formData.investmentExperience ?? ''}
                  onChange={(e) => updateField('investmentExperience', e.target.value)}
                  className={selectClass}
                >
                  <option value="" className="bg-[#12121a] text-white">
                    Select
                  </option>
                  {EXPERIENCE.map((o) => (
                    <option key={o} value={o} className="bg-[#12121a] text-white">
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Source of Funds
                </label>
                <select
                  value={formData.sourceOfFunds ?? ''}
                  onChange={(e) => updateField('sourceOfFunds', e.target.value)}
                  className={selectClass}
                >
                  <option value="" className="bg-[#12121a] text-white">
                    Select
                  </option>
                  {FUNDS_SOURCE.map((o) => (
                    <option key={o} value={o} className="bg-[#12121a] text-white">
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Investment goals</h1>
                <p className="text-sm text-muted-foreground">
                  Choose what best describes your objectives.
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Primary investment goal
                  <span className="text-red-400 ml-0.5">*</span>
                </p>
                <div className="grid gap-3">
                  {GOAL_CARDS.map((c) => {
                    const selected = formData.investmentGoal === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateField('investmentGoal', c.value)}
                        className={cardShell}
                        style={selectedCardStyle(selected)}
                      >
                        <div className="flex gap-3 items-start">
                          <span className="text-2xl leading-none">{c.emoji}</span>
                          <div>
                            <div className="font-semibold text-white">{c.title}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {c.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Time horizon
                  <span className="text-red-400 ml-0.5">*</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {HORIZON_CARDS.map((c) => {
                    const selected = formData.timeHorizon === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateField('timeHorizon', c.value)}
                        className={cardShell}
                        style={selectedCardStyle(selected)}
                      >
                        <div className="font-semibold text-white">{c.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Risk tolerance
                  <span className="text-red-400 ml-0.5">*</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {RISK_CARDS.map((c) => {
                    const selected = formData.riskTolerance === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateField('riskTolerance', c.value)}
                        className={cardShell}
                        style={selectedCardStyle(selected)}
                      >
                        <div className="font-semibold text-white text-center w-full">
                          {c.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Choose your plan</h1>
                <p className="text-sm text-muted-foreground">
                  Pick the tier that fits how you trade. You can change later.
                </p>
              </div>

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Select a plan
                <span className="text-red-400 ml-0.5">*</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLAN_OPTIONS.map((plan) => {
                  const selected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setSubmitError('');
                      }}
                      className="relative rounded-xl p-4 text-left transition-all cursor-pointer"
                      style={planCardStyle(selected)}
                    >
                      {plan.id === 'pro' && (
                        <span
                          className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            boxShadow: '0 2px 12px rgba(124, 58, 237, 0.35)',
                          }}
                        >
                          Most Popular
                        </span>
                      )}
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-lg font-bold text-white">{plan.name}</span>
                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                      <div className="mt-3 inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        7-day free trial
                      </div>
                      <ul className="mt-4 space-y-2.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex gap-2 text-sm text-white/85">
                            <Check
                              className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                No credit card required
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Agreements</h1>
                <p className="text-sm text-muted-foreground">
                  Please review and accept to finish setup.
                </p>
              </div>

              <label className="flex gap-3 cursor-pointer items-start">
                <input
                  type="checkbox"
                  checked={agreements.terms}
                  onChange={(e) =>
                    setAgreements((a) => ({ ...a, terms: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] text-[#7C3AED] focus:ring-primary/40"
                />
                <span className="text-sm text-white/90 leading-relaxed">
                  I agree to Alpha Trader&apos;s Terms of Service
                  <span className="text-red-400 ml-0.5">*</span>
                </span>
              </label>

              <label className="flex gap-3 cursor-pointer items-start">
                <input
                  type="checkbox"
                  checked={agreements.risk}
                  onChange={(e) =>
                    setAgreements((a) => ({ ...a, risk: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] text-[#7C3AED] focus:ring-primary/40"
                />
                <span className="text-sm text-white/90 leading-relaxed">
                  I acknowledge the Investment Risk Disclosure — I understand that all
                  investments carry risk and past performance does not guarantee future
                  results
                  <span className="text-red-400 ml-0.5">*</span>
                </span>
              </label>

              <label className="flex gap-3 cursor-pointer items-start">
                <input
                  type="checkbox"
                  checked={agreements.comms}
                  onChange={(e) =>
                    setAgreements((a) => ({ ...a, comms: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] text-[#7C3AED] focus:ring-primary/40"
                />
                <span className="text-sm text-white/90 leading-relaxed">
                  I consent to receive electronic communications
                  <span className="text-red-400 ml-0.5">*</span>
                </span>
              </label>

              {submitError && (
                <p className="text-sm text-red-400">{submitError}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-8 pt-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 py-3 px-4 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue}
                className={primaryBtn}
                style={primaryBtnStyle(canContinue)}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={!agreementsValid || saving || !stepPlanValid}
                className={primaryBtn}
                style={primaryBtnStyle(agreementsValid && !saving && stepPlanValid)}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Signed in as {user?.email}
        </p>
      </div>
    </div>
  );
}
