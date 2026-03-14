import { Link, useLocation } from 'react-router-dom';
import { Crown, Menu, X, LogOut, User, LayoutDashboard, Store, Sparkles, HelpCircle, Settings, LucideIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { useMarketStatus } from '@/hooks/useMarketStatus';

const navLinks: { href: string; label: string; icon: LucideIcon; tooltip: string }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Your portfolio overview' },
  { href: '/explore', label: 'Marketplace', icon: Store, tooltip: 'Browse and follow portfolios' },
  { href: '/alpha', label: 'Become an Alpha', icon: Crown, tooltip: 'Earn passive income from your portfolios' },
  { href: '/faq', label: 'FAQ', icon: HelpCircle, tooltip: 'Frequently asked questions' },
];

const planTooltips: Record<string, string> = {
  basic: 'You are on the Basic plan ($19.99/month)',
  pro: 'You are on the Pro plan ($49.99/month)',
};

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated, userPlan } = useMockAuth();
  const marketStatus = useMarketStatus();

  const handleLogout = () => {
    logout();
  };

  // Guest users only see FAQ link
  const visibleLinks = isAuthenticated ? navLinks : navLinks.filter(l => l.href === '/faq');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(5,5,8,0.7)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.04)]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <Crown className="h-5 w-5 text-primary" />
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
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[0.875rem] font-medium transition-all",
                            "font-[var(--font-heading)]",
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
                    <span className="font-mono text-xs">{user.username}</span>
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
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-[rgba(255,255,255,0.03)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.06)] shadow-xl"
                >
                  <DropdownMenuItem className="gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-[rgba(255,255,255,0.04)]">
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-[rgba(255,255,255,0.04)]">
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
                  <DropdownMenuItem
                    onClick={handleLogout}
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
            className="md:hidden p-2 rounded-lg hover:bg-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg text-[0.875rem] font-medium transition-all",
                      "font-[var(--font-heading)]",
                      location.pathname === link.href
                        ? "bg-[rgba(124,58,237,0.15)] text-primary border border-[rgba(124,58,237,0.25)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              
              {isAuthenticated && user ? (
                <>
                  <div className="px-4 py-3 border-t border-border/50 mt-2">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-mono">{user.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-center border border-border"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium bg-white text-[#050508] text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
