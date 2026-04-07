import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, X, Loader2 } from 'lucide-react';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function ProfileSetup() {
  const { user, updateProfile } = useMockAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sanitize username: lowercase, alphanumeric + underscores only
  const sanitizeUsername = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

  const handleUsernameChange = async (raw: string) => {
    const clean = sanitizeUsername(raw);
    setUsername(clean);
    setError('');

    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .maybeSingle();

      if (fetchErr) {
        setUsernameStatus('idle');
        return;
      }

      // Available if no row found, or it belongs to the current user
      if (!data || data.id === user?.id) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
      }
    } catch {
      setUsernameStatus('idle');
    }
  };

  const canSubmit =
    displayName.trim().length >= 2 &&
    username.length >= 3 &&
    usernameStatus === 'available' &&
    !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError('');

    try {
      await updateProfile(username, displayName);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-white">Alpha Trader</span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">Set up your profile</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a display name and username. You can change these later.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                className="w-full px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="your_username"
                  maxLength={20}
                  className="w-full pl-8 pr-10 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors font-mono text-sm"
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <Check className="h-4 w-4 text-emerald-400" />
                  )}
                  {usernameStatus === 'taken' && (
                    <X className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
              {/* Helper text */}
              <div className="mt-1.5 text-xs">
                {usernameStatus === 'taken' && (
                  <span className="text-red-400">This username is already taken</span>
                )}
                {usernameStatus === 'available' && (
                  <span className="text-emerald-400">Username available</span>
                )}
                {usernameStatus === 'idle' && username.length > 0 && username.length < 3 && (
                  <span className="text-muted-foreground">At least 3 characters</span>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                  : 'rgba(124, 58, 237, 0.3)',
                color: '#fff',
                boxShadow: canSubmit ? '0 4px 16px rgba(124, 58, 237, 0.3)' : 'none',
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Signed in as {user?.email}
        </p>
      </div>
    </div>
  );
}
