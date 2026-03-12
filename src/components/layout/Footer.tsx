import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  showDisclaimer?: boolean;
}

export function Footer({ showDisclaimer = true }: FooterProps) {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-8">
        {showDisclaimer && (
          <div className="mb-8 p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ This is a prototype. Not investment advice. Simulated results do not guarantee future performance.
            </p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">Alpha Trader</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/explore" className="hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link to="/leaderboard" className="hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link to="/create" className="hover:text-foreground transition-colors">
              Create
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 ACME Trader. Prototype Demo.
          </p>
        </div>
      </div>
    </footer>
  );
}