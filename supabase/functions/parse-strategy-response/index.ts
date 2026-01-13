import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuestionOption {
  value: string;
  label: string;
  description: string;
}

interface Question {
  id: string;
  question: string;
  type: 'single' | 'multi' | 'slider' | 'input';
  options?: QuestionOption[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
}

interface RequestBody {
  userMessage: string;
  currentQuestion: Question;
  conversationHistory: { role: string; content: string }[];
  currentProfile: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, currentQuestion, conversationHistory, currentProfile }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format options for the prompt
    const optionsText = currentQuestion.options 
      ? currentQuestion.options.map(o => `- "${o.value}": ${o.label} - ${o.description}`).join('\n')
      : '';

    const sliderText = currentQuestion.sliderConfig
      ? `Slider range: ${currentQuestion.sliderConfig.min}${currentQuestion.sliderConfig.unit} to ${currentQuestion.sliderConfig.max}${currentQuestion.sliderConfig.unit}`
      : '';

    const systemPrompt = `You are an investment strategy advisor assistant helping users build personalized portfolios through natural conversation.

Your responsibilities:
1. Parse user responses to strategy questions and extract structured data
2. Answer questions about investment concepts clearly and simply
3. Handle corrections to previous answers
4. Detect unclear responses and ask clarifying questions

CURRENT QUESTION: "${currentQuestion.question}"
QUESTION TYPE: ${currentQuestion.type}
${optionsText ? `AVAILABLE OPTIONS:\n${optionsText}` : ''}
${sliderText}

PROFILE SO FAR: ${JSON.stringify(currentProfile)}

RESPONSE FORMAT (respond ONLY with valid JSON):
{
  "intent": "answer" | "question" | "correction" | "unclear",
  "field": "the question id field (${currentQuestion.id}) if answering",
  "value": "extracted value matching available options, or number for slider, or string for input",
  "explanation": "helpful text to show the user (for questions, confirmations, or clarifications)",
  "confidence": 0.0-1.0,
  "suggestedFollowUp": "optional clarifying question if unclear"
}

GUIDELINES:
- For ANSWERS: Map the user's natural language to one of the available option values. Be generous with interpretation.
  - "I want to grow my money" → primaryGoal: "accumulation"
  - "maybe 10 years" → timeline: "5-10" or "10+"
  - "I'm okay with some risk" → various risk-related values
- For multi-select questions: Return an array of values
- For slider questions: Extract a number within the valid range
- For input questions: Extract the text or number directly
- For QUESTIONS: Provide a helpful 2-3 sentence explanation about the concept
- For CORRECTIONS: Identify which field to update and the new value
- For UNCLEAR: Suggest a specific follow-up question to clarify

Be conversational and friendly in your explanations. Users should feel like they're talking to a knowledgeable advisor.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-10), // Keep last 10 messages for context
          { role: "user", content: userMessage }
        ],
        temperature: 0.3, // Lower temperature for more consistent parsing
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment.", code: "RATE_LIMIT" }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue.", code: "PAYMENT_REQUIRED" }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI processing error", code: "AI_ERROR" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty AI response", code: "EMPTY_RESPONSE" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the AI response
    let parsed;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({
          intent: "unclear",
          explanation: "I had trouble understanding that. Could you try rephrasing or use one of the options below?",
          confidence: 0,
          suggestedFollowUp: "Please try again or select from the available options."
        }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(parsed), 
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Parse strategy response error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        code: "SERVER_ERROR"
      }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
