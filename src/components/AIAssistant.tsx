import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { AssistantPanel } from './ai-assistant/AssistantPanel';
import { getContextQuickActions } from './ai-assistant/contextQuickActions';
import { placeOrder } from '@/lib/alpacaClient';
import { sendChatMessage } from '@/lib/chatService';
import { getMorningBriefing } from '@/lib/briefingService';
import type { Message, QuickAction } from './ai-assistant/types';

let msgCounter = 0;
const genId = () => `msg-${++msgCounter}`;

function getPageName(pathname: string): string {
  if (pathname === '/dashboard') return 'your Dashboard';
  if (pathname === '/explore') return 'the Marketplace';
  if (pathname.startsWith('/portfolio/')) return 'a portfolio detail page';
  if (pathname.startsWith('/simulation/')) return 'a simulation';
  if (pathname === '/invest') return 'the Create Portfolio page';
  if (pathname === '/faq') return 'the FAQ';
  return 'Alpha Trader';
}

function getWelcomePrompt(pathname: string): string {
  if (pathname === '/dashboard')
    return 'Want me to check on your positions, pull some quotes, or find trade ideas?';
  if (pathname === '/explore')
    return 'Looking for a portfolio to follow? I can pull live data and compare options.';
  if (pathname.startsWith('/portfolio/'))
    return 'Want analysis on this portfolio, or should I look up its holdings?';
  if (pathname.startsWith('/simulation/'))
    return 'Want me to check how your simulation is performing against the market?';
  if (pathname === '/invest')
    return 'Ready to build a portfolio? Tell me your risk appetite and I\'ll suggest an approach.';
  if (pathname === '/faq')
    return 'Ask me anything about trading, markets, or the platform.';
  return 'I can pull live quotes, analyze stocks, check your portfolio, or help you find trade ideas. What are you thinking?';
}

function buildWelcome(pathname: string): Message {
  const pageName = getPageName(pathname);
  const prompt = getWelcomePrompt(pathname);
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hey! I see you're on ${pageName}. ${prompt}`,
    quickActions: getContextQuickActions(pathname, 0),
  };
}

export function AIAssistant() {
  const { isAuthenticated } = useMockAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [buildWelcome('/')]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasPlayedPulse, setHasPlayedPulse] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const isMobile = useIsMobile();
  const userMessageCount = useRef(0);
  const briefingFetched = useRef(false);

  const hiddenPaths = ['/', '/login', '/signup'];
  const isHidden = !isAuthenticated || hiddenPaths.includes(location.pathname);

  // Update context-aware quick actions on navigation
  useEffect(() => {
    if (!isHidden) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          const contextActions = getContextQuickActions(
            location.pathname,
            userMessageCount.current,
          );
          return [...prev.slice(0, -1), { ...last, quickActions: contextActions }];
        }
        return prev;
      });
    }
  }, [location.pathname, isHidden]);

  // Fetch morning briefing on first panel open (once per session, weekdays only)
  useEffect(() => {
    if (open && !briefingFetched.current) {
      briefingFetched.current = true;
      void (async () => {
        const briefing = await getMorningBriefing();
        if (briefing) {
          setMessages((prev) => [
            ...prev,
            {
              id: genId(),
              role: 'assistant',
              content: `**Morning Briefing**\n\n${briefing}`,
            },
          ]);
        }
      })();
    }
  }, [open]);

  // Pulse animation
  useEffect(() => {
    if (!isHidden && !hasPlayedPulse) {
      const t = setTimeout(() => setHasPlayedPulse(true), 4500);
      return () => clearTimeout(t);
    }
  }, [isHidden, hasPlayedPulse]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  // ── Core: send every message to Claude ──────────────────────

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const trimmed = text.trim();
      const userMsg: Message = { id: genId(), role: 'user', content: trimmed };
      setInputValue('');
      userMessageCount.current += 1;

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      void (async () => {
        const contextActions = getContextQuickActions(
          location.pathname,
          userMessageCount.current,
        );

        // Build conversation history for Claude (skip welcome message)
        const chatHistory = [...messages, userMsg]
          .filter((m) => m.id !== 'welcome')
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const aiResult = await sendChatMessage(chatHistory);

        if (aiResult) {
          setApiOffline(false);
          // Check if Claude proposed any trades
          if (aiResult.tradeProposals && aiResult.tradeProposals.length > 0) {
            const trade = aiResult.tradeProposals[0]; // Handle first proposal
            const sideVerb = trade.side === 'buy' ? 'buy' : 'sell';
            const shareWord = trade.qty === 1 ? 'share' : 'shares';
            const tradeDetails = {
              side: trade.side,
              symbol: trade.symbol,
              qty: trade.qty,
              reasoning: trade.reasoning,
            };

            // Show Claude's analysis + trade confirmation
            setMessages((prev) => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: aiResult.response,
              },
              {
                id: genId(),
                role: 'assistant',
                content: `Ready to ${sideVerb} ${trade.qty} ${shareWord} of **${trade.symbol}**?\n\n*${trade.reasoning}*`,
                pendingTrade: tradeDetails,
                quickActions: [
                  {
                    label: 'Confirm Trade',
                    tradeQuickAction: 'confirm',
                    pendingTrade: tradeDetails,
                  },
                  { label: 'Cancel', tradeQuickAction: 'cancel' },
                ],
              },
            ]);
          } else {
            // Standard response
            setMessages((prev) => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: aiResult.response,
                quickActions: contextActions,
              },
            ]);
          }
        } else {
          setApiOffline(true);
          // Claude unavailable -- show a helpful fallback instead of the old keyword engine
          setMessages((prev) => [
            ...prev,
            {
              id: genId(),
              role: 'assistant',
              content:
                "I'm having trouble connecting to the AI service right now. You can still place trades by typing something like \"buy 5 shares of AAPL\", or try again in a moment.",
              quickActions: contextActions,
            },
          ]);
        }

        setIsTyping(false);
      })();
    },
    [location.pathname, messages],
  );

  // ── Trade confirmation / cancellation ───────────────────────

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (action.tradeQuickAction === 'confirm' && action.pendingTrade) {
        const { side, symbol, qty } = action.pendingTrade;
        setIsTyping(true);
        void (async () => {
          try {
            const order = await placeOrder(symbol, qty, side as 'buy' | 'sell');
            const detailLines = [
              `**Side:** ${order.side.toUpperCase()}`,
              `**Symbol:** ${order.symbol}`,
              `**Quantity:** ${order.qty}`,
              `**Type:** ${order.type} (${order.time_in_force})`,
              `**Status:** ${order.status}`,
              `**Order ID:** \`${order.id}\``,
            ].join('\n');
            setMessages((prev) => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: `Order placed successfully.\n\n${detailLines}`,
                tradeResult: { success: true, orderId: order.id },
                quickActions: getContextQuickActions(
                  location.pathname,
                  userMessageCount.current,
                ),
              },
            ]);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setMessages((prev) => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: `The order could not be placed: ${message}`,
                tradeResult: { success: false, error: message },
                quickActions: getContextQuickActions(
                  location.pathname,
                  userMessageCount.current,
                ),
              },
            ]);
          } finally {
            setIsTyping(false);
          }
        })();
        return;
      }

      if (action.tradeQuickAction === 'cancel') {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            role: 'assistant',
            content: 'Trade cancelled. What else can I help with?',
            quickActions: getContextQuickActions(
              location.pathname,
              userMessageCount.current,
            ),
          },
        ]);
        return;
      }

      if (action.navigateTo) {
        navigate(action.navigateTo);
      }
      sendMessage(action.label);
    },
    [navigate, sendMessage, location.pathname],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (isHidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'fixed z-40 flex min-h-11 min-w-11 items-center justify-center rounded-full transition-all duration-200 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.4)]',
          'hover:scale-105 active:scale-95',
          'h-14 w-14',
          !hasPlayedPulse && !open && 'assistant-pulse',
        )}
        style={{ bottom: 24, right: 24, background: 'white', color: '#050508' }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <AssistantPanel
          messages={messages}
          inputValue={inputValue}
          isTyping={isTyping}
          isMobile={isMobile}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          onQuickAction={handleQuickAction}
          onClose={() => setOpen(false)}
          apiOffline={apiOffline}
          onReconnect={() => setApiOffline(false)}
        />
      )}
    </>
  );
}
