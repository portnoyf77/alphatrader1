import { Navigate, useLocation } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { TrialExpiredModal } from '@/components/TrialExpiredModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowExpiredTrial?: boolean;
}

export function ProtectedRoute({ children, allowExpiredTrial = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isTrialExpired } = useMockAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] animate-pulse"
          style={{ boxShadow: '0 0 40px rgba(124, 58, 237, 0.12)' }}
        >
          <Crown className="h-8 w-8 text-primary" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground">Verifying your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show trial expired modal for gated pages
  if (isTrialExpired && !allowExpiredTrial) {
    return <TrialExpiredModal />;
  }

  return <>{children}</>;
}