import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MockUser {
  id: string;
  username: string;
  email: string;
}

interface MockAuthContextType {
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  trialStartDate: number | null;
  userPlan: string | null;
  isTrialExpired: boolean;
  selectPlan: (plan: string) => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

const FREE_TRIAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Generate a random user ID like @inv_7x2k
const generateUserId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `@inv_${result}`;
};

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStartDate, setTrialStartDate] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedTrial = localStorage.getItem('trialStartDate');
    if (storedTrial) {
      setTrialStartDate(parseInt(storedTrial, 10));
    }
    const storedPlan = localStorage.getItem('userPlan');
    if (storedPlan) {
      setUserPlan(storedPlan);
    }
    setIsLoading(false);
  }, []);

  const isTrialExpired = trialStartDate !== null && !userPlan && (Date.now() - trialStartDate > FREE_TRIAL_MS);

  const updateUsernameForPlan = (plan: string | null, currentUser: MockUser) => {
    let username = generateUserId();
    if (plan === 'basic') username = '@alex_investor';
    else if (plan === 'pro') username = '@sam_alpha';
    const updated = { ...currentUser, username };
    setUser(updated);
    localStorage.setItem('mockUser', JSON.stringify(updated));
  };

  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedPlan = localStorage.getItem('userPlan');
    let username = generateUserId();
    if (storedPlan === 'basic') username = '@alex_investor';
    else if (storedPlan === 'pro') username = '@sam_alpha';

    const mockUser: MockUser = {
      id: crypto.randomUUID(),
      username,
      email,
    };
    
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));

    // Set trial start if not already set
    if (!localStorage.getItem('trialStartDate')) {
      const now = Date.now();
      setTrialStartDate(now);
      localStorage.setItem('trialStartDate', now.toString());
    }
  };

  const signup = async (email: string, password: string) => {
    await login(email, password);
  };

  const selectPlan = (plan: string) => {
    setUserPlan(plan);
    localStorage.setItem('userPlan', plan);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  return (
    <MockAuthContext.Provider value={{ 
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
    }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}