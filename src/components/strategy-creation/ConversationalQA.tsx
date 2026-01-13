import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Check, SkipForward, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ChatMessage } from './ChatMessage';
import { QuickReplyButtons } from './QuickReplyButtons';
import { ChatInput } from './ChatInput';
import {
  StrategyProfile,
  initialProfile,
  questions,
  Question
} from '@/lib/strategyProfile';
import { parseWithAI, ParseResult } from '@/lib/aiStrategyParser';
import { parseNaturalLanguageResponse, getFollowUpPrompt } from '@/lib/nlpParser';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  isExplanation?: boolean;
}

interface ConversationalQAProps {
  onComplete: (profile: StrategyProfile) => void;
  onCancel: () => void;
}

export function ConversationalQA({ onComplete, onCancel }: ConversationalQAProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<StrategyProfile>(initialProfile);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderValue, setSliderValue] = useState(20);
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const [awaitingResponse, setAwaitingResponse] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentQuestion = questions[currentQuestionIndex];
  const isComplete = currentQuestionIndex >= questions.length;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isProcessing]);

  // Initial greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      addAssistantMessage(
        `Welcome! I'm your investment advisor. Let's build a personalized strategy together.

I'll ask you a few questions about your goals, risk tolerance, and preferences. Feel free to **type naturally** — I understand conversational language — or use the quick reply buttons.

You can also ask me questions like "What does volatility mean?" and I'll explain!`
      );

      // Show first question after greeting
      setTimeout(() => {
        showQuestion(questions[0]);
      }, 1500);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const addAssistantMessage = (content: string, isExplanation = false) => {
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content,
        isExplanation
      }]);
      setIsTyping(false);
      setAwaitingResponse(true);
    }, 600);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content
    }]);
    setAwaitingResponse(false);
  };

  const showQuestion = (question: Question) => {
    let message = question.question;
    if (question.subtitle) {
      message += `\n\n${question.subtitle}`;
    }
    addAssistantMessage(message);

    // Reset multi-select values for new question
    if (question.type === 'multi') {
      setMultiSelectValues([]);
    }
    if (question.type === 'slider' && question.sliderConfig) {
      setSliderValue(question.sliderConfig.min +
        (question.sliderConfig.max - question.sliderConfig.min) / 2);
    }
  };

  const moveToNextQuestion = useCallback((updatedProfile: StrategyProfile) => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      // All questions answered
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        addAssistantMessage(
          `Excellent! I have all the information I need to create your personalized strategy. Let me analyze your preferences and build something perfect for you.`
        );

        // Complete after showing final message
        setTimeout(() => {
          onComplete(updatedProfile);
        }, 2000);
      }, 500);
    } else {
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        showQuestion(questions[nextIndex]);
      }, 500);
    }
  }, [currentQuestionIndex, onComplete]);

  const handleQuickReply = (value: string) => {
    if (!currentQuestion || isComplete) return;

    const option = currentQuestion.options?.find(o => o.value === value);
    const label = option?.label || value;

    if (currentQuestion.type === 'multi') {
      // Toggle selection for multi-select
      setMultiSelectValues(prev => {
        if (prev.includes(value)) {
          return prev.filter(v => v !== value);
        }
        return [...prev, value];
      });
    } else {
      // Single select - submit immediately
      addUserMessage(label);

      const updatedProfile = {
        ...profile,
        [currentQuestion.id]: value
      };
      setProfile(updatedProfile);
      moveToNextQuestion(updatedProfile);
    }
  };

  const handleMultiSelectConfirm = () => {
    if (!currentQuestion || currentQuestion.type !== 'multi') return;

    const labels = multiSelectValues.map(v =>
      currentQuestion.options?.find(o => o.value === v)?.label || v
    ).join(', ');

    addUserMessage(labels || 'No specific preference');

    const updatedProfile = {
      ...profile,
      [currentQuestion.id]: multiSelectValues
    };
    setProfile(updatedProfile);
    moveToNextQuestion(updatedProfile);
  };

  const handleSliderConfirm = () => {
    if (!currentQuestion || currentQuestion.type !== 'slider') return;

    addUserMessage(`${sliderValue}%`);

    const updatedProfile = {
      ...profile,
      [currentQuestion.id]: sliderValue
    };
    setProfile(updatedProfile);
    moveToNextQuestion(updatedProfile);
  };

  const handleSkip = () => {
    if (!currentQuestion?.isOptional) return;

    addUserMessage("I'll skip this one");

    // Keep default value and move on
    moveToNextQuestion(profile);
  };

  const handleAIParseResult = (result: ParseResult) => {
    if (result.intent === 'answer' && result.value !== undefined) {
      // AI successfully parsed the answer
      const updatedProfile = {
        ...profile,
        [currentQuestion.id]: result.value
      } as StrategyProfile;
      setProfile(updatedProfile);
      
      // Show confirmation if AI provided explanation
      if (result.explanation) {
        addAssistantMessage(result.explanation);
        setTimeout(() => moveToNextQuestion(updatedProfile), 1000);
      } else {
        moveToNextQuestion(updatedProfile);
      }
    } else if (result.intent === 'question') {
      // User asked a question - show explanation without advancing
      addAssistantMessage(result.explanation || "That's a great question! Let me explain...", true);
    } else if (result.intent === 'correction') {
      // User wants to change a previous answer
      if (result.field && result.value !== undefined) {
        const updatedProfile = {
          ...profile,
          [result.field]: result.value
        } as StrategyProfile;
        setProfile(updatedProfile);
        addAssistantMessage(
          result.explanation || `Got it! I've updated your ${result.field}. Now, back to the current question...`,
          true
        );
      }
    } else {
      // Intent unclear - show follow-up prompt
      addAssistantMessage(
        result.explanation || result.suggestedFollowUp || getFollowUpPrompt(currentQuestion.id)
      );
    }
  };

  const handleTextSubmit = async (text: string) => {
    if (!currentQuestion || isComplete || isProcessing) return;

    addUserMessage(text);
    setIsProcessing(true);

    try {
      // Convert messages to conversation history format
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Try AI parsing first
      const aiResult = await parseWithAI(
        text,
        currentQuestion,
        conversationHistory,
        profile
      );

      // If AI gave us high confidence, use it
      if (aiResult.confidence > 0.5 || aiResult.intent === 'question') {
        handleAIParseResult(aiResult);
      } else {
        // Fall back to local parser for low confidence
        const localResult = parseNaturalLanguageResponse(text, currentQuestion.id);
        
        if (localResult) {
          const updatedProfile = {
            ...profile,
            [currentQuestion.id]: localResult.value
          } as StrategyProfile;
          setProfile(updatedProfile);
          moveToNextQuestion(updatedProfile);
        } else if (aiResult.explanation) {
          // Use AI's explanation even with low confidence
          handleAIParseResult(aiResult);
        } else {
          // Neither could parse - ask for clarification
          setTimeout(() => {
            addAssistantMessage(getFollowUpPrompt(currentQuestion.id));
          }, 500);
        }
      }
    } catch (error) {
      console.error('Text parsing error:', error);
      // Fall back to local parser
      const localResult = parseNaturalLanguageResponse(text, currentQuestion.id);
      
      if (localResult) {
        const updatedProfile = {
          ...profile,
          [currentQuestion.id]: localResult.value
        } as StrategyProfile;
        setProfile(updatedProfile);
        moveToNextQuestion(updatedProfile);
      } else {
        setTimeout(() => {
          addAssistantMessage(getFollowUpPrompt(currentQuestion.id));
        }, 500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion || isComplete || !awaitingResponse) return null;

    switch (currentQuestion.type) {
      case 'single':
        return (
          <QuickReplyButtons
            options={currentQuestion.options || []}
            onSelect={handleQuickReply}
          />
        );

      case 'multi':
        return (
          <div className="space-y-3">
            <QuickReplyButtons
              options={currentQuestion.options || []}
              onSelect={handleQuickReply}
              multiSelect
              selectedValues={multiSelectValues}
            />
            <div className="flex gap-2 pl-11">
              <Button
                size="sm"
                onClick={handleMultiSelectConfirm}
                className="rounded-full"
              >
                <Check className="h-3 w-3 mr-1" />
                Confirm {multiSelectValues.length > 0 && `(${multiSelectValues.length})`}
              </Button>
              {currentQuestion.isOptional && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="rounded-full text-muted-foreground"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip
                </Button>
              )}
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-4 pl-11 pr-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-12">
                {currentQuestion.sliderConfig?.min}%
              </span>
              <Slider
                value={[sliderValue]}
                onValueChange={([v]) => setSliderValue(v)}
                min={currentQuestion.sliderConfig?.min}
                max={currentQuestion.sliderConfig?.max}
                step={currentQuestion.sliderConfig?.step}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {currentQuestion.sliderConfig?.max}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary">
                {sliderValue}% volatility
              </span>
              <Button size="sm" onClick={handleSliderConfirm} className="rounded-full">
                <Check className="h-3 w-3 mr-1" />
                Confirm
              </Button>
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="flex gap-2 pl-11">
            {currentQuestion.isOptional && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="rounded-full text-muted-foreground"
              >
                <SkipForward className="h-3 w-3 mr-1" />
                Skip
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate progress
  const progress = Math.round((currentQuestionIndex / questions.length) * 100);

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Investment Advisor</h3>
            <p className="text-xs text-muted-foreground">
              {isComplete ? 'Complete!' : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      </div>

      {/* Messages */}
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}

          {isTyping && (
            <ChatMessage role="assistant" content="" isTyping />
          )}

          {isProcessing && !isTyping && (
            <div className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}

          {/* Quick reply buttons appear after last assistant message */}
          {!isTyping && !isProcessing && renderQuestionInput()}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border/50 p-4 bg-background/50">
          <ChatInput
            onSubmit={handleTextSubmit}
            placeholder={
              isComplete
                ? "Creating your strategy..."
                : isProcessing
                ? "Processing your response..."
                : "Type naturally or ask a question..."
            }
            disabled={isComplete || isTyping || isProcessing}
            autoFocus
          />
        </div>
      </CardContent>
    </Card>
  );
}
