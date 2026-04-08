import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crown, Menu, X, LogOut, User, LayoutDashboard, Store, HelpCircle, LucideIcon, ChevronDown, BarChart3, Zap, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { useMarketStatus } from '@/hooks/useMarketStatus';

const navLinks: { href: string; label: string; icon: LucideIcon; tooltip: string }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Your portfolio overview' },
  { href: '/portfolio-tracker', label: 'Portfolio', icon: BarChart3, tooltip: 'Live Alpaca positions & trades' },
  { href: '/research', label: 'Research', icon: Zap, tooltip: 'Market news & watchlist' },
  { href: '/build', label: 'Build', icon: Sparkles, tooltip: 'AI Portfolio Builder' },
  { href: '/explore', label: 'Marketplace', icon: Store, tooltip: 'Browse and follow portfolios' },
];

const planTooltips: Record<string, string> = {
  basic: 'You are on the Basic plan ($19.99/month)',
  pro: 'You are on the Pro plan ($49.99/month)',
};

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, userPlan } = useMockAuth();
  const marketStatus = useMarketStatus();

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  // Guest users only see FAQ link
  const visibleLinks = isAuthenticated ? navLinks : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(5,5,8,0.85)] backdrop-blur-[20px]">
      {/* Glowing bottom separator */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="absolute bottom-0 left-[10%] right-[10%] h-[6px] bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className="flex items-center gap-2 group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-lg font-bold">Alpha Trader</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Alpha Trader — Home</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Nav links */}
          {visibleLinks.length > 0 && (
            <TooltipProvider delayDuration={300}>
              <div className="hidden md:flex items-center gap-1">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Tooltip key={link.href}>
                      <TooltipTrigger asChild>
                        <Link
                          to={link.href}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[0.875rem] font-medium transition-all outline-none",
                            "font-[var(--font-heading)]",
                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]",
                            location.pathname === link.href
                              ? "bg-[rgba(124,58,237,0.15)] text-primary border border-[rgba(124,58,237,0.25)]"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">{link.tooltip}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}

          <div className="hidden md:flex items-center gap-3">
            {/* Market Status — authenticated pages only */}
            {isAuthenticated && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help px-2">
                      <div className={cn("w-[6px] h-[6px] rounded-full flex-shrink-0", marketStatus.dotClass)} />
                      <span className={cn("text-[0.75rem] font-medium whitespace-nowrap", marketStatus.color)}>
                        {marketStatus.label}
                      </span>
                      <span className="text-[0.75rem] text-muted-foreground">·</span>
                      <span className="text-[0.75rem] text-muted-foreground whitespace-nowrap">
                        {marketStatus.etTimeString}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[250px]">{marketStatus.tooltipText}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/80 transition-colors cursor-pointer outline-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{user.displayName || user.username}</span>
                    {userPlan && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        userPlan === 'pro' 
                          ? "bg-primary/20 text-primary border border-primary/30" 
                          : "bg-secondary text-muted-foreground border border-border"
                      )}>
                        {userPlan}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-[rgba(255,255,255,0.03)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.1)] shadow-xl"
                >
                  <DropdownMenuItem
                    onClick={() => navigate('/faq')}
                    className="gap-2 cursor-pointer text-sm"
                  >
                    <HelpCircle className="h-4 w-4" />
                    FAQ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setLogoutDialogOpen(true)}
                    className="gap-2 cursor-pointer text-sm text-[rgba(239,68,68,0.7)] hover:text-[rgba(239,68,68,0.9)] focus:text-[rgba(239,68,68,0.9)] focus:bg-[rgba(239,68,68,0.06)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-secondary touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] pointer-events-auto">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className={cn(
                'absolute top-0 right-0 bottom-0 flex w-[min(100vw,20rem)] flex-col',
                'border-l border-white/10 bg-[#050508] shadow-2xl',
                'animate-in slide-in-from-right duration-300',
              )}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4">
                <span className="font-heading text-sm font-semibold text-foreground">Menu</span>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-secondary touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain py-3 px-2">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-[0.875rem] font-medium transition-colors outline-none touch-manipulation',
                        'font-[var(--font-heading)]',
                        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]',
                        location.pathname === link.href
                          ? 'border border-[rgba(124,58,237,0.25)] bg-[rgba(124,58,237,0.15)] text-primary'
                          : 'border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {link.label}
                    </Link>
                  );
                })}

                {isAuthenticated && user ? (
                  <>
                    <Link
                      to="/faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-[0.875rem] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground font-[var(--font-heading)] touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
                    >
                      <HelpCircle className="h-4 w-4 shrink-0" />
                      FAQ
                    </Link>
                    <div className="mt-2 border-t border-border/50 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Signed in as</p>
                      <p className="text-sm font-semibold">{user.displayName || user.username}</p>
                      {user.displayName && (
                        <p className="text-xs font-mono text-muted-foreground">{user.username}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoutDialogOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="min-h-11 w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-4">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-[#050508] touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>Sign out of Alpha Trader?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={confirmLogout}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
