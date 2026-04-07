/**
 * Chat service that calls the /api/chat serverless endpoint (Claude API with tool-use).
 * Returns Claude's response text plus any trade proposals Claude made.
 */

import { serverlessApiUrl, explainServerlessNetworkError } from '@/lib/serverlessApiUrl';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type TradeProposal = {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  reasoning: string;
};

export type ChatResponse = {
  response: string;
  tradeProposals?: TradeProposal[];
};

/**
 * Send a message to the Claude-powered chat endpoint.
 * Returns the AI response, or null if the endpoint is unavailable.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<ChatResponse | null> {
  try {
    const res = await fetch(serverlessApiUrl('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      console.warn('[chatService] API returned', res.status);
      return null;
    }

    const data = await res.json();
    if (data.response) {
      return {
        response: data.response,
        tradeProposals: data.tradeProposals,
      };
    }
    return null;
  } catch (err) {
    console.warn('[chatService]', explainServerlessNetworkError(err));
    return null;
  }
}
