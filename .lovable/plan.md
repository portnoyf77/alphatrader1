

## AI Assistant Audit & Fix Plan

### Current State Assessment

The existing implementation already covers ~90% of what's requested. The response engine has intent detection, knowledge base, page-aware responses, anti-loop logic, and portfolio creation guidance. The main issues are:

1. **Dead `/alpha` references** — responseEngine.ts and contextQuickActions.ts still link to the removed `/alpha` route
2. **Weak anti-loop** — only compares first 80 characters, misses semantically similar responses
3. **No conversation history awareness** — responses don't consider what was already discussed
4. **Missing follow-up handling** — e.g., after user says "I want growth," assistant can't continue that thread on `/invest`
5. **Static quick actions** — same set shown repeatedly regardless of conversation state

### Changes

#### 1. `src/components/ai-assistant/responseEngine.ts`

**Remove `/alpha` references:**
- Line 64: Remove `/alpha` page name mapping
- Lines 290, 293, 301, 303, 311: Change `navigateTo: '/alpha'` to `navigateTo: '/invest'` and update labels from "Go to Alpha page" / "Learn more on Alpha page" to "Create a portfolio" / "Start building"
- Line 494: Update navigation handler for "alpha" to point to `/invest`
- Line 498: Remove Alpha from the navigation list, or redirect to `/invest`

**Strengthen anti-loop (lines 179-197):**
- Compare normalized content (lowercase, strip markdown) against last 3 responses
- Use substring similarity (check if >60% of words overlap) instead of first-80-char match
- When duplicate detected, vary the clarification message from a small pool (3 variants) to avoid the anti-loop message itself looping

**Add conversation-aware follow-ups for portfolio creation (lines 247-267):**
- Track if user previously expressed a preference (growth/stability/income) in the conversation
- When on `/invest` and user said "I want growth," respond with Ruby recommendation + reasoning instead of re-asking
- When user said "I want stability," recommend Pearl
- When user said "balanced mix," recommend Sapphire
- Each follow-up suggests proceeding with AI-Assisted flow

#### 2. `src/components/ai-assistant/contextQuickActions.ts`

- Lines 57-62: Remove the `/alpha` route quick actions block entirely (route no longer exists)
- The fallback (lines 69-74) already covers generic actions, so no gap

#### 3. `src/components/AIAssistant.tsx`

- Lines 20-21: Remove `/alpha` from `getPageName` (already done previously but verify)
- Pass full message history to `getResponse` so it can detect follow-up context (currently only passes `recentResponses` strings — extend to pass the last few user messages for intent chaining)

### Files Modified
- `src/components/ai-assistant/responseEngine.ts` — remove `/alpha` links, improve anti-loop, add follow-up awareness
- `src/components/ai-assistant/contextQuickActions.ts` — remove `/alpha` quick actions
- `src/components/AIAssistant.tsx` — pass conversation context to response engine

### What stays unchanged
- AssistantPanel.tsx (UI, styling, layout)
- types.ts
- Floating button, typing indicator, message bubbles, show/hide logic

