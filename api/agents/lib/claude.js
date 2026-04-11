/**
 * Shared Claude API helper
 * Standardizes all agent calls to Claude with consistent error handling.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function repairJson(text) {
  let fixed = text.replace(/,\s*([}\]])/g, '$1');
  fixed = fixed.replace(/(")\s*\n\s*(")/g, '$1,\n  $2');
  fixed = fixed.replace(/(})\s*\n\s*({)/g, '$1,\n  $2');
  fixed = fixed.replace(/(])\s*\n\s*(\[)/g, '$1,\n  $2');
  fixed = fixed.replace(/(\d|true|false|null)\s*\n\s*(")/g, '$1,\n  $2');
  return fixed;
}

export async function askClaude(prompt, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const { maxTokens = 2000, model = 'claude-sonnet-4-20250514', maxRetries = 1 } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) console.log(`[askClaude] Retry ${attempt} after JSON parse failure`);

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

    try {
      return JSON.parse(text.trim());
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          try {
            return JSON.parse(repairJson(jsonMatch[0]));
          } catch (repairErr) {
            lastError = repairErr;
          }
        }
      } else {
        lastError = new Error('No JSON object found in Claude response');
      }
    }
  }

  throw lastError;
}
