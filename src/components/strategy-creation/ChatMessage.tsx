import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'assistant' | 'user';
  content: string;
  isTyping?: boolean;
}

export function ChatMessage({ role, content, isTyping = false }: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  
  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-300',
          isAssistant 
            ? 'bg-primary/20 text-primary shadow-[0_0_15px_hsl(350_100%_55%_/_0.3)]' 
            : 'bg-secondary text-muted-foreground'
        )}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>
      
      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-sm px-4 py-3 transition-all duration-300',
          isAssistant 
            ? 'bg-secondary/80 text-foreground rounded-tl-none border border-primary/20 shadow-[0_0_20px_hsl(350_100%_55%_/_0.1)]' 
            : 'bg-primary text-primary-foreground rounded-tr-none shadow-[0_0_15px_hsl(350_100%_55%_/_0.2)]'
        )}
      >
        {isTyping ? (
          <div className="flex gap-1 py-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}