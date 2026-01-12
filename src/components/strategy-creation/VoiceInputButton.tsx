import { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VoiceInputButtonProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onListeningChange?: (isListening: boolean) => void;
  disabled?: boolean;
}

// Check for browser support
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export function VoiceInputButton({ 
  onTranscript, 
  onListeningChange,
  disabled = false 
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);
    const recog = new SpeechRecognitionClass();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = 'en-US';
    
    recog.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      onTranscript(transcript, result.isFinal);
    };
    
    recog.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
    };
    
    recog.onerror = () => {
      setIsListening(false);
      onListeningChange?.(false);
    };
    
    setRecognition(recog);
    
    return () => {
      recog.abort();
    };
  }, [onTranscript, onListeningChange]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsListening(true);
        onListeningChange?.(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [recognition, isListening, onListeningChange]);

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" disabled className="text-muted-foreground/50">
              <MicOff className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Voice input not supported</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={toggleListening}
            className={cn('relative', isListening && 'text-destructive hover:text-destructive')}
          >
            <Mic className={cn('h-5 w-5', isListening && 'animate-pulse')} />
            {isListening && <span className="absolute inset-0 rounded-md animate-ping bg-destructive/20" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>{isListening ? 'Click to stop' : 'Click to speak'}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
