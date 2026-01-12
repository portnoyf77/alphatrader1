import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/explore', label: 'Marketplace' },
  { href: '/create', label: 'Create' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/90 backdrop-blur-xl">
      {/* Red accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Stranger Things style */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <span className="font-display text-xl font-bold tracking-wider text-foreground group-hover:text-primary transition-colors">
                MVP
              </span>
              <span className="font-display text-lg font-bold tracking-[0.2em] text-primary block -mt-1 group-hover:text-glow transition-all">
                INVESTING
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-sm text-sm font-medium transition-all duration-300 relative",
                  location.pathname === link.href
                    ? "text-primary text-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {link.label}
                {location.pathname === link.href && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary glow-primary" />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <Button asChild variant="neon">
              <Link to="/create">Create Strategy</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-sm hover:bg-secondary text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary/20 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-sm text-sm font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/20 text-primary text-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Button asChild variant="neon" className="mt-2">
                <Link to="/create" onClick={() => setMobileMenuOpen(false)}>Create Strategy</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}