/**
 * Shared Claude API helper
 * Standardizes all agent calls to Claude with consistent error handling.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Send a prompt to Claude and get back parsed JSON.
 * @param {string} prompt - The full prompt to send
 * @param {object} options - { maxTokens, model }
 * @returns {object} Parsed JSON from Claude's response
 */
export async function askClaude(prompt, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const { maxTokens = 2000, model = 'claude-haiku-4-5-20251001' } = options;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');

  // Parse JSON robustly (handles markdown fences, preamble text)
  try {
    return JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Claude response');
    return JSON.parse(jsonMatch[0]);
  }
}
