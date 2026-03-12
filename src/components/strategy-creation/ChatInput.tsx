import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VoiceInputButton } from './VoiceInputButton';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ 
  onSubmit, 
  placeholder = "Type your answer...",
  disabled = false,
  autoFocus = false
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue && !disabled) {
      onSubmit(trimmedValue);
      setValue('');
    }
  };

  const handleTranscript = (text: string, isFinal: boolean) => {
    setValue(text);
    
    // Auto-submit after final result with a short delay
    if (isFinal && text.trim()) {
      setTimeout(() => {
        onSubmit(text.trim());
        setValue('');
      }, 500);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 glass-card rounded-xl"
    >
      <VoiceInputButton 
        onTranscript={handleTranscript}
        onListeningChange={setIsListening}
        disabled={disabled}
      />
      
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isListening ? "Listening..." : placeholder}
        disabled={disabled}
        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
      />
      
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim() || disabled}
        className="bg-primary hover:bg-primary/90 rounded-lg"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
