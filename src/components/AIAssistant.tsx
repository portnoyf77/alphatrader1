import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { AssistantPanel } from './ai-assistant/AssistantPanel';
import { getResponse } from './ai-assistant/responseEngine';
import { getContextQuickActions } from './ai-assistant/contextQuickActions';
import { parseTradeIntent } from './ai-assistant/tradeParser';
import { placeOrder, getLatestQuote, getPositions, getAccountInfo } from '@/lib/alpacaClient';
import { sendChatMessage } from '@/lib/chatService';
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
  if (pathname === '/dashboard') return 'Want to check on your portfolios, or explore something new?';
  if (pathname === '/explore') return 'Looking for a portfolio to follow? I can help you filter and compare.';
  if (pathname.startsWith('/portfolio/')) return 'Want to know more about this portfolio?';
  if (pathname.startsWith('/simulation/')) return 'Want to check how your simulation is performing?';
  if (pathname === '/invest') return 'Ready to build a portfolio? I can help you choose between AI-Assisted and Manual.';
  
  if (pathname === '/faq') return 'Have a question? Ask me anything — I might be faster than scrolling.';
  return "I can help you with portfolios, risk levels, fees, or navigating the platform. What's on your mind?";
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
  const isMobile = useIsMobile();
  // Track recent assistant response content for anti-loop
  const recentResponses = useRef<string[]>([]);
  // Track user message count for quick action reduction
  const userMessageCount = useRef(0);

  const hiddenPaths = ['/', '/login', '/signup'];
  const isHidden = !isAuthenticated || hiddenPaths.includes(location.pathname);

  // Update context-aware quick actions on navigation
  useEffect(() => {
    if (!isHidden) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          const contextActions = getContextQuickActions(location.pathname, userMessageCount.current);
          return [...prev.slice(0, -1), { ...last, quickActions: contextActions }];
        }
        return prev;
      });
    }
  }, [location.pathname, isHidden]);

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

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    const userMsg: Message = { id: genId(), role: 'user', content: trimmed };
    setInputValue('');
    userMessageCount.current += 1;

    const intent = parseTradeIntent(trimmed);
    if (intent.isTrade) {
      const { side, symbol, qty } = intent;
      const sideVerb = side === 'buy' ? 'buy' : 'sell';
      const shareWord = qty === 1 ? 'share' : 'shares';
      const confirmContent = `I'll place a market order to ${sideVerb} ${qty} ${shareWord} of ${symbol}. Confirm?`;
      const tradeDetails = { side, symbol, qty };
      const assistantMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: confirmContent,
        pendingTrade: tradeDetails,
        quickActions: [
          {
            label: 'Confirm Trade',
            tradeQuickAction: 'confirm',
            pendingTrade: tradeDetails,
          },
          { label: 'Cancel', tradeQuickAction: 'cancel' },
        ],
      };
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      return;
    }

    // Quote lookup: "price of AAPL", "what's TSLA at", "quote MSFT"
    const quoteMatch = trimmed.match(
      /(?:price\s+(?:of\s+)?|quote\s+(?:for\s+)?|what'?s\s+|how\s+(?:much\s+)?is\s+)([A-Za-z]{1,6})\b/i
    ) ?? trimmed.match(/^([A-Za-z]{1,5})\s+(?:price|quote)\s*\??$/i);
    if (quoteMatch) {
      const sym = quoteMatch[1].toUpperCase();
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      void (async () => {
        try {
          const q = await getLatestQuote(sym);
          const mid = ((q.bidPrice + q.askPrice) / 2).toFixed(2);
          const spread = (q.askPrice - q.bidPrice).toFixed(2);
          setMessages(prev => [
            ...prev,
            {
              id: genId(),
              role: 'assistant',
              content: `**${sym}** latest quote:\n\nBid: $${q.bidPrice.toFixed(2)} / Ask: $${q.askPrice.toFixed(2)}\nMid: **$${mid}** (spread: $${spread})\n\nThis is a 15-min delayed NBBO quote from Alpaca.`,
              quickActions: [
                { label: `Buy 1 share of ${sym}` },
                { label: `Buy 5 shares of ${sym}` },
                { label: `Buy 10 shares of ${sym}` },
              ],
            },
          ]);
        } catch {
          setMessages(prev => [
            ...prev,
            {
              id: genId(),
              role: 'assistant',
              content: `I couldn't fetch a quote for ${sym}. Make sure it's a valid US stock symbol and try again.`,
            },
          ]);
        } finally {
          setIsTyping(false);
        }
      })();
      return;
    }

    // Account info: "my account", "buying power", "how much cash"
    const accountMatch = /\b(account|buying\s*power|cash\s*(available|balance)?|my\s*balance)\b/i.test(trimmed);
    if (accountMatch) {
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      void (async () => {
        try {
          const acct = await getAccountInfo();
          const equity = parseFloat(acct.equity).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          const bp = parseFloat(acct.buying_power).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          const cash = parseFloat(acct.cash).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          const pv = parseFloat(acct.portfolio_value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          setMessages(prev => [
            ...prev,
            {
              id: genId(),
              role: 'assistant',
              content: `Here's your account summary:\n\n**Equity:** ${equity}\n**Portfolio Value:** ${pv}\n**Cash:** ${cash}\n**Buying Power:** ${bp}\n**Status:** ${acct.status}`,
              quickActions: getContextQuickActions(location.pathname, userMessageCount.current),
            },
          ]);
        } catch {
          setMessages(prev => [
            ...prev,
            {
              id: genId(),
              role: 'assistant',
              content: 'I had trouble fetching your account info. The Alpaca API might be temporarily unavailable.',
            },
          ]);
        } finally {
          setIsTyping(false);
        }
      })();
      return;
    }

    // Positions: "my positions", "what do I own", "my holdings"
    const positionsMatch = /\b(positions?|holdings?|what\s*(do\s*)?i\s*own|my\s*stocks?|what\s*i\s*have)\b/i.test(trimmed);
    if (positionsMatch) {
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      void (async () => {
        try {
          const pos = await getPositions();
          if (pos.length === 0) {
            setMessages(prev => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: "You don't have any open positions right now. Want to place a trade?",
                quickActions: [{ label: 'Buy 5 shares of AAPL' }, { label: 'Buy 5 shares of QQQ' }],
              },
            ]);
          } else {
            const lines = pos.map((p) => {
              const qty = parseFloat(p.qty);
              const price = parseFloat(p.current_price).toFixed(2);
              const pl = parseFloat(p.unrealized_pl);
              const plStr = pl >= 0 ? `+$${pl.toFixed(2)}` : `-$${Math.abs(pl).toFixed(2)}`;
              return `**${p.symbol}** — ${qty} shares @ $${price} (${plStr})`;
            });
            const totalPL = pos.reduce((sum, p) => sum + parseFloat(p.unrealized_pl), 0);
            const totalStr = totalPL >= 0 ? `+$${totalPL.toFixed(2)}` : `-$${Math.abs(totalPL).toFixed(2)}`;
            setMessages(prev => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: `You have ${pos.length} open position${pos.length > 1 ? 's' : ''}:\n\n${lines.join('\n')}\n\nTotal unrealized P&L: **${totalStr}**`,
                quickActions: getContextQuickActions(location.pathname, userMessageCount.current),
              },
            ]);
          }
        } catch {
          setMessages(prev => [
            ...prev,
            {
              id: genId(),
              role: 'assistant',
              content: "I couldn't fetch your positions right now. Try again in a moment.",
            },
          ]);
        } finally {
          setIsTyping(false);
        }
      })();
      return;
    }

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Try Claude API first, fall back to keyword engine
    void (async () => {
      const contextActions = getContextQuickActions(location.pathname, userMessageCount.current);

      // Build conversation history for Claude
      const chatHistory = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      // Try to get account context for Claude
      let context: Parameters<typeof sendChatMessage>[1];
      try {
        const [acctInfo, posInfo] = await Promise.allSettled([getAccountInfo(), getPositions()]);
        context = {};
        if (acctInfo.status === 'fulfilled') {
          context.equity = parseFloat(acctInfo.value.equity) || undefined;
          context.cash = parseFloat(acctInfo.value.cash) || undefined;
        }
        if (posInfo.status === 'fulfilled' && posInfo.value.length > 0) {
          context.positions = posInfo.value.map(p => ({
            symbol: p.symbol,
            qty: parseFloat(p.qty),
            unrealizedPL: parseFloat(p.unrealized_pl),
            currentPrice: parseFloat(p.current_price),
          }));
        }
      } catch {
        // No context available -- that's fine
      }

      const aiResult = await sendChatMessage(chatHistory, context);

      if (aiResult) {
        // Claude responded
        setMessages(prev => [
          ...prev,
          {
            id: genId(),
            role: 'assistant',
            content: aiResult.response,
            quickActions: contextActions,
          },
        ]);
      } else {
        // Fall back to keyword engine
        setMessages(prev => {
          const recentUserMsgs = prev
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .slice(-5);
          const result = getResponse(trimmed, location.pathname, recentResponses.current, recentUserMsgs);

          recentResponses.current = [...recentResponses.current.slice(-2), result.content];

          const response: Message = {
            id: genId(),
            role: 'assistant',
            content: result.content,
            quickActions: result.quickActions || contextActions,
          };
          return [...prev, response];
        });
      }

      setIsTyping(false);
    })();
  }, [location.pathname, messages]);

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
            setMessages(prev => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: `Your order was placed successfully.\n\n${detailLines}`,
                tradeResult: { success: true, orderId: order.id },
                quickActions: getContextQuickActions(location.pathname, userMessageCount.current),
              },
            ]);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setMessages(prev => [
              ...prev,
              {
                id: genId(),
                role: 'assistant',
                content: `The order could not be placed: ${message}`,
                tradeResult: { success: false, error: message },
                quickActions: getContextQuickActions(location.pathname, userMessageCount.current),
              },
            ]);
          } finally {
            setIsTyping(false);
          }
        })();
        return;
      }

      if (action.tradeQuickAction === 'cancel') {
        setMessages(prev => [
          ...prev,
          {
            id: genId(),
            role: 'assistant',
            content: 'Trade cancelled. What else can I help with?',
            quickActions: getContextQuickActions(location.pathname, userMessageCount.current),
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
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'fixed z-40 flex items-center justify-center rounded-full transition-all duration-200',
          'shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.4)]',
          'hover:scale-105 active:scale-95',
          'w-14 h-14',
          isMobile && 'w-12 h-12',
          !hasPlayedPulse && !open && 'assistant-pulse',
        )}
        style={{ bottom: 24, right: 24, background: 'white', color: '#050508' }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open
          ? <X className={cn('h-6 w-6', isMobile && 'h-5 w-5')} />
          : <MessageCircle className={cn('h-6 w-6', isMobile && 'h-5 w-5')} />
        }
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
        />
      )}
    </>
  );
}
