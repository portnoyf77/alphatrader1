import { useMockAuth } from '@/contexts/MockAuthContext';
import Landing from './Landing';
import Dashboard from './Dashboard';

export default function Home() {
  const { isAuthenticated } = useMockAuth();
  
  // Show Dashboard for authenticated users, Landing for guests
  return isAuthenticated ? <Dashboard /> : <Landing />;
}
