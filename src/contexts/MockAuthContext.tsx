import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AppUser {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (email: string) => Promise<void>;
  logout: () => void;
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

// Convert Supabase user to our app user shape
function toAppUser(su: SupabaseUser): AppUser {
  return {
    id: su.id,
    username: generateUsername(su.id),
    email: su.email || '',
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
      trialStartDate: null,
      userPlan: null,
      isTrialExpired: false,
      selectPlan: () => {},
    } as AuthContextType;
  }
  return context;
}
