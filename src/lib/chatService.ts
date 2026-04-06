/**
 * Chat service that calls the /api/chat serverless endpoint (Claude API).
 * Falls back gracefully if the endpoint is unavailable.
 */

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AccountContext = {
  equity?: number;
  cash?: number;
  positions?: { symbol: string; qty: number; unrealizedPL: number; currentPrice: number }[];
  watchlist?: string[];
};

type ChatResponse = {
  response: string;
  usedAI: boolean;
};

/**
 * Send a message to the Claude-powered chat endpoint.
 * Returns the AI response text, or null if the endpoint is unavailable.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  context?: AccountContext,
): Promise<ChatResponse | null> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });

    if (!res.ok) {
      console.warn('[chatService] API returned', res.status);
      return null;
    }

    const data = await res.json();
    if (data.response) {
      return { response: data.response, usedAI: true };
    }
    return null;
  } catch (err) {
    // Endpoint not available (dev mode or misconfigured)
    console.warn('[chatService] Chat endpoint unavailable, using fallback');
    return null;
  }
}
