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
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isAssistant 
            ? 'bg-primary/20 text-primary' 
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
          'max-w-[80%] rounded-2xl px-4 py-3',
          isAssistant 
            ? 'bg-secondary text-foreground rounded-tl-sm' 
            : 'bg-primary text-primary-foreground rounded-tr-sm'
        )}
      >
        {isTyping ? (
          <div className="flex gap-1 py-1">
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
