import { Navigate, useLocation } from 'react-router-dom';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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