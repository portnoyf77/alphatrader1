import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Sparkles, Crown, SendHorizontal } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  quickActions?: string[];
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Welcome! I'm your Alpha Advisor. I can help you with:\n\n• Understanding your portfolios and performance\n• Explaining investment concepts\n• Building a new portfolio\n• Navigating the platform\n\nWhat would you like to know?",
  quickActions: [
    'How are my portfolios doing?',
    'Build a new portfolio',
    'Explain risk levels',
    "What's an Alpha?",
  ],
};

// ── Placeholder responses (Part 2 will add real ones) ──────────────────
function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('portfolio') && (lower.includes('doing') || lower.includes('performance') || lower.includes('how')))
    return "Your portfolios are performing well overall. Head to Dashboard to see detailed metrics including 30-day returns, allocation breakdowns, and comparisons against the S&P 500.";
  if (lower.includes('build') || lower.includes('create') || lower.includes('new portfolio'))
    return "Great idea! You can create a new portfolio by navigating to Dashboard and clicking \"+ Create New Portfolio\", or I can take you there directly. The AI will ask you 6 quick questions to build a personalized portfolio.";
  if (lower.includes('risk') || lower.includes('level'))
    return "Alpha Trader uses three risk tiers represented by gemstones:\n\n💎 **Pearl** — Conservative. Low volatility, capital preservation focus.\n💎 **Sapphire** — Moderate. Balanced growth with managed risk.\n💎 **Ruby** — Aggressive. High growth potential with larger swings.\n\nYour risk level is determined during portfolio creation based on your answers.";
  if (lower.includes('alpha') || lower.includes('what'))
    return "An **Alpha** is a portfolio creator on the platform. Alphas build investment portfolios that other users can follow and allocate capital to. In return, Alphas earn 0.25% annually on the capital allocated to their portfolios. Visit \"Become an Alpha\" to learn more.";
  if (lower.includes('fee') || lower.includes('cost'))
    return "Alpha Trader charges two fees:\n\n• **Platform fee:** 0.25% annually on invested capital\n• **Alpha fee:** 0.25% annually (paid to the portfolio creator)\n• **Total:** 0.50% annually\n\nNo trading commissions or hidden fees.";
  if (lower.includes('simulate') || lower.includes('simulation'))
    return "Simulation lets you test a portfolio with live market data before committing real capital. Your simulated portfolio tracks real prices and performance — it's a risk-free way to validate your strategy.";
  return "That's a great question! I'm still learning, but I can help with portfolio performance, risk levels, platform navigation, and building new portfolios. Try asking about one of those topics.";
}

let msgCounter = 0;
const genId = () => `msg-${++msgCounter}`;

// ── Component ──────────────────────────────────────────────────────────
export function AIAssistant() {
  const { isAuthenticated } = useMockAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasPlayedPulse, setHasPlayedPulse] = useState(false);
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't render on public pages
  const hiddenPaths = ['/', '/login', '/signup'];
  const isHidden = !isAuthenticated || hiddenPaths.includes(location.pathname);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Pulse animation on first load
  useEffect(() => {
    if (!isHidden && !hasPlayedPulse) {
      const t = setTimeout(() => setHasPlayedPulse(true), 4500); // 3 pulses at 1.5s each
      return () => clearTimeout(t);
    }
  }, [isHidden, hasPlayedPulse]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: genId(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const delay = 800 + Math.random() * 400;
    setTimeout(() => {
      const response: Message = { id: genId(), role: 'assistant', content: getResponse(text) };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, delay);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (isHidden) return null;

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'fixed z-40 flex items-center justify-center rounded-full transition-all duration-200',
          'shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.4)]',
          'hover:scale-105 active:scale-95',
          'w-14 h-14',
          isMobile && 'w-12 h-12',
          !hasPlayedPulse && !open && 'assistant-pulse',
        )}
        style={{
          bottom: 24,
          right: 24,
          background: 'white',
          color: '#050508',
        }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X className={cn("h-6 w-6", isMobile && "h-5 w-5")} /> : <MessageCircle className={cn("h-6 w-6", isMobile && "h-5 w-5")} />}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          className="fixed z-[45] flex flex-col assistant-panel-enter"
          style={{
            bottom: isMobile ? 0 : 96,
            right: isMobile ? 0 : 24,
            width: isMobile ? '100%' : 400,
            height: isMobile ? 'calc(100vh - 80px)' : 560,
            maxHeight: isMobile ? undefined : 'calc(100vh - 120px)',
            borderRadius: isMobile ? '20px 20px 0 0' : 20,
            background: 'rgba(5, 5, 8, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 16px 64px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between shrink-0 px-5"
            style={{
              height: 60,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <span className="font-heading font-semibold text-sm text-foreground">Alpha Advisor</span>
                <p className="text-[0.7rem] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Your personal investment guide
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.06)]"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* ── Messages ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'assistant' ? (
                  <div className="flex gap-2.5 items-start">
                    <div
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-1"
                      style={{ background: 'rgba(124,58,237,0.15)' }}
                    >
                      <Crown className="h-3 w-3 text-primary" />
                    </div>
                    <div className="space-y-2" style={{ maxWidth: '85%' }}>
                      <div
                        className="text-[0.875rem] leading-relaxed whitespace-pre-line"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 12,
                          padding: '12px 16px',
                        }}
                      >
                        {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                      {/* Quick actions */}
                      {msg.quickActions && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.quickActions.map((action) => (
                            <button
                              key={action}
                              onClick={() => sendMessage(action)}
                              className="text-left transition-all duration-150 hover:scale-[1.02]"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.75)',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                              }}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div
                      className="text-[0.875rem] leading-relaxed"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        maxWidth: '75%',
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5 items-start">
                <div
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-1"
                  style={{ background: 'rgba(124,58,237,0.15)' }}
                >
                  <Crown className="h-3 w-3 text-primary" />
                </div>
                <div
                  className="flex items-center gap-1"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: '12px 16px',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground typing-dot-3" />
                </div>
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 flex items-center gap-2 px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '10px 14px',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
              style={{ background: 'hsl(var(--primary))' }}
            >
              <SendHorizontal className="h-4 w-4 text-primary-foreground" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
