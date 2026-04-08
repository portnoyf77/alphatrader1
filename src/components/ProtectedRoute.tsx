interface ProtectedRouteProps {
  children: React.ReactNode;
  allowExpiredTrial?: boolean;
  skipProfileCheck?: boolean;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
