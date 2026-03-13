import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  showDisclaimer?: boolean;
}

export function Footer({ showDisclaimer = true }: FooterProps) {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-8">
        {showDisclaimer && (
          <div className="mb-8 rounded-[10px]" style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.08)', padding: '12px 20px', fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.55)' }}>
            <p className="text-center">
              ⚠️ Alpha Trader is not a registered investment adviser. This platform is for informational and educational purposes only. Past performance does not guarantee future results.
            </p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">Alpha Trader</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
            <Link to="/dashboard" className="hover:text-foreground transition-colors whitespace-nowrap">
              Dashboard
            </Link>
            <Link to="/explore" className="hover:text-foreground transition-colors whitespace-nowrap">
              Marketplace
            </Link>
            <Link to="/invest" className="hover:text-foreground transition-colors whitespace-nowrap">
              Create
            </Link>
            <Link to="/alpha" className="hover:text-foreground transition-colors whitespace-nowrap">
              Alpha
            </Link>
            <Link to="/faq" className="hover:text-foreground transition-colors whitespace-nowrap">
              FAQ
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2026 Alpha Trader. All rights reserved. Alpha Trader is not a registered investment adviser. This platform is for informational and educational purposes only. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
