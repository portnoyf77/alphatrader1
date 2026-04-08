import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  needsProfileSetup: boolean;
}

export interface OnboardingData {
  // Step 1: Personal Info
  displayName: string;
  username: string;
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  // Step 2: Investor Profile
  employmentStatus?: string;
  annualIncome?: string;
  netWorth?: string;
  investmentExperience?: string;
  sourceOfFunds?: string;
  // Step 3: Investment Goals
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** signUp then signInWithPassword; true if session active, false if email confirmation blocks login. */
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (username: string, displayName: string) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  trialStartDate: number | null;
  userPlan: string | null;
  isTrialExpired: boolean;
  selectPlan: (plan: string) => void;
}

// Keep the old name so all existing imports still work
type MockAuthContextType = AuthContextType;

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

const FREE_TRIAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Generate anonymous username from Supabase user ID
function generateUsername(userId: string): string {
  const short = userId.replace(/-/g, '').slice(0, 4);
  return `@inv_${short}`;
}

/** Base user before profile row is merged (needsProfileSetup defaults true until DB says otherwise). */
function toAppUser(su: SupabaseUser): AppUser {
  return {
    id: su.id,
    username: generateUsername(su.id),
    displayName: '',
    email: su.email || '',
    needsProfileSetup: true,
  };
}

type ProfileRow = {
  username: string | null;
  display_name: string | null;
  onboarding_completed: boolean | null;
};

/**
 * Load profiles row and merge into AppUser. Uses maybeSingle() so missing row is OK.
 * needsProfileSetup is false only when onboarding_completed is true.
 */
async function buildAppUserFromSession(su: SupabaseUser): Promise<AppUser> {
  const base = toAppUser(su);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, display_name, onboarding_completed')
      .eq('id', su.id)
      .maybeSingle();

    if (error || !data) {
      return base;
    }
    const row = data as ProfileRow;
    const complete = Boolean(row.onboarding_completed);
    return {
      ...base,
      username: row.username ? `@${row.username.replace(/^@/, '')}` : base.username,
      displayName: row.display_name?.trim() || '',
      needsProfileSetup: !complete,
    };
  } catch {
    return base;
  }
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStartDate, setTrialStartDate] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  /** Avoid duplicate hydrate when login() already merged profile before SIGNED_IN listener runs. */
  const loginHydrateRef = useRef(false);

  const initTrialIfNeeded = () => {
    if (!localStorage.getItem('trialStartDate')) {
      const now = Date.now();
      setTrialStartDate(now);
      localStorage.setItem('trialStartDate', now.toString());
    }
  };

  // Bootstrap: session + profile must resolve before isLoading becomes false
  useEffect(() => {
    const storedTrial = localStorage.getItem('trialStartDate');
    if (storedTrial) setTrialStartDate(parseInt(storedTrial, 10));
    const storedPlan = localStorage.getItem('userPlan');
    if (storedPlan) setUserPlan(storedPlan);

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        const u = await buildAppUserFromSession(session.user);
        if (cancelled) return;
        setUser(u);
        initTrialIfNeeded();
      } else {
        setUser(null);
      }
      if (!cancelled) setIsLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Initial session is handled by getSession() above
      if (event === 'INITIAL_SESSION') return;
      if (loginHydrateRef.current) return;

      setIsLoading(true);
      try {
        if (session?.user) {
          const u = await buildAppUserFromSession(session.user);
          setUser(u);
          initTrialIfNeeded();
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const isTrialExpired =
    trialStartDate !== null && !userPlan && Date.now() - trialStartDate > FREE_TRIAL_MS;

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No session after sign-in');
    }
    loginHydrateRef.current = true;
    setIsLoading(true);
    try {
      const u = await buildAppUserFromSession(session.user);
      setUser(u);
      initTrialIfNeeded();
    } finally {
      setIsLoading(false);
      loginHydrateRef.current = false;
    }
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/profile-setup`,
      },
    });
    if (signUpError) throw signUpError;
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    return !loginError;
  };

  // Save username + display name to profiles table
  const updateProfile = async (username: string, displayName: string) => {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username.toLowerCase().replace(/^@/, ''),
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) throw error;

    // Update local state immediately
    setUser({
      ...user,
      username: `@${username.toLowerCase().replace(/^@/, '')}`,
      displayName: displayName.trim(),
      needsProfileSetup: false,
    });
  };

  // Save all onboarding data + mark onboarding complete
  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: data.username.toLowerCase().replace(/^@/, ''),
        display_name: data.displayName.trim(),
        phone: data.phone || null,
        date_of_birth: data.dateOfBirth || null,
        country: data.country || null,
        employment_status: data.employmentStatus || null,
        annual_income: data.annualIncome || null,
        net_worth: data.netWorth || null,
        investment_experience: data.investmentExperience || null,
        source_of_funds: data.sourceOfFunds || null,
        investment_goal: data.investmentGoal || null,
        time_horizon: data.timeHorizon || null,
        risk_tolerance: data.riskTolerance || null,
        accepted_terms_at: now,
        accepted_risk_disclosure_at: now,
        onboarding_completed: true,
        updated_at: now,
      }, { onConflict: 'id' });

    if (error) throw error;

    setUser({
      ...user,
      username: `@${data.username.toLowerCase().replace(/^@/, '')}`,
      displayName: data.displayName.trim(),
      needsProfileSetup: false,
    });
  };

  const selectPlan = (plan: string) => {
    setUserPlan(plan);
    localStorage.setItem('userPlan', plan);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('trialStartDate');
    localStorage.removeItem('userPlan');
  };

  return (
    <MockAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        completeOnboarding,
        trialStartDate,
        userPlan,
        isTrialExpired,
        selectPlan,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: async (_email: string, _password: string) => {},
      signup: async (_email: string, _password: string) => false,
      logout: () => {},
      updateProfile: async () => {},
      completeOnboarding: async () => {},
      trialStartDate: null,
      userPlan: null,
      isTrialExpired: false,
      selectPlan: () => {},
    } as AuthContextType;
  }
  return context;
}
