import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  login: (email: string) => Promise<void>;
  signup: (email: string) => Promise<void>;
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

// Quick synchronous user object -- never blocks auth flow
function toAppUser(su: SupabaseUser): AppUser {
  return {
    id: su.id,
    username: generateUsername(su.id),
    displayName: '',
    email: su.email || '',
    needsProfileSetup: true, // assume true until profile loads
  };
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStartDate, setTrialStartDate] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  // Bootstrap: check existing session + listen for auth changes
  useEffect(() => {
    // 1. Load local plan / trial data
    const storedTrial = localStorage.getItem('trialStartDate');
    if (storedTrial) setTrialStartDate(parseInt(storedTrial, 10));
    const storedPlan = localStorage.getItem('userPlan');
    if (storedPlan) setUserPlan(storedPlan);

    // 2. Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(toAppUser(session.user));
        // Initialize trial if first session
        if (!localStorage.getItem('trialStartDate')) {
          const now = Date.now();
          setTrialStartDate(now);
          localStorage.setItem('trialStartDate', now.toString());
        }
      }
      setIsLoading(false);
    });

    // 3. Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(toAppUser(session.user));
          // Initialize trial on first auth
          if (!localStorage.getItem('trialStartDate')) {
            const now = Date.now();
            setTrialStartDate(now);
            localStorage.setItem('trialStartDate', now.toString());
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // After auth resolves, load profile from Supabase in the background
  useEffect(() => {
    if (!user || !user.needsProfileSetup) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, onboarding_completed')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (!error && data && data.onboarding_completed) {
          setUser((prev) =>
            prev && prev.id === user.id
              ? {
                  ...prev,
                  username: data.username ? `@${data.username}` : prev.username,
                  displayName: data.display_name || '',
                  needsProfileSetup: false,
                }
              : prev
          );
        }
      } catch {
        // Profile fetch failed -- needsProfileSetup stays true, user
        // will land on the onboarding wizard (safe fallback)
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const isTrialExpired =
    trialStartDate !== null && !userPlan && Date.now() - trialStartDate > FREE_TRIAL_MS;

  // Magic link sign-in (works for both new and existing users)
  const login = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
    // After this, Supabase sends a magic link email.
    // The user clicks it, gets redirected back, and onAuthStateChange fires.
  };

  // Signup is the same as login for magic link
  const signup = async (email: string) => {
    await login(email);
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
      login: async () => {},
      signup: async () => {},
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
