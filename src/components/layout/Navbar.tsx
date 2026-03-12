import { Link, useLocation } from 'react-router-dom';
import { Crown, Menu, X, LogOut, User, LayoutDashboard, Store, TrendingUp, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '@/contexts/MockAuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const navLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Marketplace', icon: Store },
  { href: '/invest', label: 'Invest', icon: TrendingUp },
  { href: '/alpha', label: 'Become an Alpha', icon: Crown },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);
  const location = useLocation();
  const { user, login, signup, logout, isAuthenticated } = useMockAuth();

  const handleLogout = () => {
    logout();
  };

  const handleQuickLogin = () => {
    login('demo@alphatrader.com', 'demo123');
    setLoginDialogOpen(false);
  };

  const handleQuickSignup = () => {
    signup('newuser@alphatrader.com', 'demo123');
    setSignupDialogOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">Alpha Trader</span>
          </Link>

          {/* Only show nav links if authenticated */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === link.href
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs">{user.username}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                {/* Sign In Dialog */}
                <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Welcome back</DialogTitle>
                      <DialogDescription>
                        This is a demo — click Sign In to continue with mock credentials.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input 
                          id="login-email" 
                          defaultValue="demo@alphatrader.com" 
                          readOnly 
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input 
                          id="login-password" 
                          type="password" 
                          defaultValue="demo123" 
                          readOnly 
                          className="bg-muted"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center p-2 rounded-lg bg-primary/5 border border-primary/20">
                        🎭 Demo mode: credentials are pre-filled
                      </div>
                      <Button onClick={handleQuickLogin} className="w-full">
                        Sign In
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Sign Up Dialog */}
                <Dialog open={signupDialogOpen} onOpenChange={setSignupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Sign Up</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create your account</DialogTitle>
                      <DialogDescription>
                        This is a demo — click Sign Up to create a mock account with an anonymous ID.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input 
                          id="signup-email" 
                          defaultValue="newuser@alphatrader.com" 
                          readOnly 
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input 
                          id="signup-password" 
                          type="password" 
                          defaultValue="demo123" 
                          readOnly 
                          className="bg-muted"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center p-2 rounded-lg bg-primary/5 border border-primary/20">
                        🎭 Demo mode: you'll receive a random anonymous ID like <span className="font-mono">@inv_3k9m</span>
                      </div>
                      <Button onClick={handleQuickSignup} className="w-full">
                        Sign Up
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
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
              {/* Only show nav links if authenticated */}
              {isAuthenticated && navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === link.href
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                  <button
                    onClick={() => {
                      handleQuickLogin();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-center border border-border"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      handleQuickSignup();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground text-center"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
