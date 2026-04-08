import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  needsProfileSetup: boolean;
}

export interface OnboardingData {
  displayName: string;
  username: string;
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  employmentStatus?: string;
  annualIncome?: string;
  netWorth?: string;
  investmentExperience?: string;
  sourceOfFunds?: string;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (username: string, displayName: string) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  trialStartDate: number | null;
  userPlan: string | null;
  isTrialExpired: boolean;
  selectPlan: (plan: string) => void;
}

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

const HARDCODED_USER: AppUser = {
  id: 'dev-user-001',
  username: '@felix',
  displayName: 'Felix',
  email: 'felixportnoy@gmail.com',
  needsProfileSetup: false,
};

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<AppUser>(HARDCODED_USER);
  const [userPlan, setUserPlan] = useState<string | null>(() => localStorage.getItem('userPlan'));

  const trialStartDate = (() => {
    const stored = localStorage.getItem('trialStartDate');
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem('trialStartDate', now.toString());
    return now;
  })();

  const selectPlan = (plan: string) => {
    setUserPlan(plan);
    localStorage.setItem('userPlan', plan);
  };

  return (
    <MockAuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        isLoading: false,
        login: async () => {},
        signup: async () => true,
        logout: () => {},
        updateProfile: async () => {},
        completeOnboarding: async () => {},
        trialStartDate,
        userPlan,
        isTrialExpired: false,
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
      user: HARDCODED_USER,
      isAuthenticated: true,
      isLoading: false,
      login: async () => {},
      signup: async () => true,
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
