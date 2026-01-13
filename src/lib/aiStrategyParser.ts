import { Question, StrategyProfile } from './strategyProfile';

export interface ParseResult {
  intent: 'answer' | 'question' | 'correction' | 'unclear';
  field?: keyof StrategyProfile;
  value?: string | string[] | number;
  explanation?: string;
  confidence: number;
  suggestedFollowUp?: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PARSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-strategy-response`;

export async function parseWithAI(
  userMessage: string,
  currentQuestion: Question,
  conversationHistory: ConversationMessage[],
  currentProfile: Partial<StrategyProfile>
): Promise<ParseResult> {
  try {
    const response = await fetch(PARSE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        userMessage,
        currentQuestion: {
          id: currentQuestion.id,
          question: currentQuestion.question,
          type: currentQuestion.type,
          options: currentQuestion.options,
          sliderConfig: currentQuestion.sliderConfig,
        },
        conversationHistory: conversationHistory.map(m => ({
          role: m.role,
          content: m.content,
        })),
        currentProfile,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error codes
      if (response.status === 429) {
        return {
          intent: 'unclear',
          explanation: "I'm getting a lot of requests right now. Please wait a moment and try again.",
          confidence: 0,
          suggestedFollowUp: "Please try again in a few seconds.",
        };
      }
      
      if (response.status === 402) {
        return {
          intent: 'unclear',
          explanation: "AI credits have been exhausted. Please use the quick reply buttons below.",
          confidence: 0,
          suggestedFollowUp: "Select from the options below.",
        };
      }

      throw new Error(errorData.error || 'Failed to parse response');
    }

    const result: ParseResult = await response.json();
    return result;

  } catch (error) {
    console.error('AI parsing error:', error);
    // Return a fallback that prompts user to use buttons
    return {
      intent: 'unclear',
      explanation: "I had trouble processing that. Could you try using the options below or rephrase your answer?",
      confidence: 0,
      suggestedFollowUp: "Please select from the available options.",
    };
  }
}
