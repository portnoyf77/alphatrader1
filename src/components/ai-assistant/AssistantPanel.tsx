import { useRef, useEffect } from 'react';
import { X, Sparkles, Crown, SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, QuickAction } from './types';

interface AssistantPanelProps {
  messages: Message[];
  inputValue: string;
  isTyping: boolean;
  isMobile: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onQuickAction: (action: QuickAction) => void;
  onClose: () => void;
}

function renderMarkdown(content: string) {
  return content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function AssistantPanel({
  messages, inputValue, isTyping, isMobile,
  onInputChange, onSubmit, onQuickAction, onClose,
}: AssistantPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  return (
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
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0 px-5"
        style={{ height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
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
        <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-secondary">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
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
                    style={
                      msg.tradeResult?.success === true
                        ? {
                            background: 'rgba(5, 150, 105, 0.12)',
                            border: '1px solid rgba(5, 150, 105, 0.4)',
                            borderRadius: 12,
                            padding: '12px 16px',
                            boxShadow: '0 0 24px rgba(5, 150, 105, 0.15)',
                          }
                        : msg.tradeResult?.success === false
                          ? {
                              background: 'rgba(220, 38, 38, 0.1)',
                              border: '1px solid rgba(220, 38, 38, 0.45)',
                              borderRadius: 12,
                              padding: '12px 16px',
                              boxShadow: '0 0 20px rgba(220, 38, 38, 0.12)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: 12,
                              padding: '12px 16px',
                            }
                    }
                  >
                    {renderMarkdown(msg.content)}
                  </div>
                  {msg.pendingTrade && (
                    <div
                      className="text-[0.8rem]"
                      style={{
                        border: '1px solid rgba(124, 58, 237, 0.45)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        background: 'rgba(15, 12, 25, 0.85)',
                        boxShadow:
                          '0 0 0 1px rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.35)',
                      }}
                    >
                      <p
                        className="text-[0.65rem] uppercase tracking-wider font-semibold mb-2.5"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        Market order preview
                      </p>
                      <dl
                        className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-3 gap-y-2"
                        style={{ color: 'rgba(255,255,255,0.92)' }}
                      >
                        <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Symbol</dt>
                        <dd className="font-mono font-semibold">{msg.pendingTrade.symbol}</dd>
                        <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Quantity</dt>
                        <dd>{msg.pendingTrade.qty}</dd>
                        <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Side</dt>
                        <dd className="capitalize">{msg.pendingTrade.side}</dd>
                        <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Order type</dt>
                        <dd>Market</dd>
                      </dl>
                    </div>
                  )}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.quickActions.map((action) => {
                        const isConfirmTrade = action.tradeQuickAction === 'confirm';
                        return (
                          <button
                            key={
                              action.tradeQuickAction
                                ? `${action.label}-${action.tradeQuickAction}`
                                : action.label
                            }
                            type="button"
                            onClick={() => onQuickAction(action)}
                            className={cn(
                              'text-left transition-all duration-150',
                              isConfirmTrade
                                ? 'glow-commit rounded-lg hover:scale-[1.02]'
                                : 'hover:scale-[1.02]',
                            )}
                            style={
                              isConfirmTrade
                                ? {
                                    padding: '8px 16px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }
                                : {
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    padding: '8px 16px',
                                    fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.75)',
                                    cursor: 'pointer',
                                  }
                            }
                            onMouseEnter={(e) => {
                              if (isConfirmTrade) return;
                              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              if (isConfirmTrade) return;
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            }}
                          >
                            {action.label}
                          </button>
                        );
                      })}
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

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="shrink-0 flex items-center gap-2 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
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
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-30 bg-primary"
        >
          <SendHorizontal className="h-4 w-4 text-primary-foreground" />
        </button>
      </form>
    </div>
  );
}
