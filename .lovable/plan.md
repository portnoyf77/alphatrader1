

## Bug Fix Plan

### Status: Most items already implemented

After thorough codebase review, nearly all items in this prompt are already correctly implemented. The only remaining changes involve **Section 5 (Remove /alpha page)** and one minor tooltip fix.

---

### Changes Required

#### 1. Remove /alpha route and references

**`src/App.tsx`**
- Remove the import of `Alpha` component
- Remove the `/alpha` route definition

**`src/pages/Dashboard.tsx`** (line 238)
- Change the "Learn How →" button link from `/alpha` to `/invest`

**`src/components/AlphaSpotlight.tsx`** (line 156)
- Change the "Become an Alpha" button link from `/alpha` to `/invest`

**`src/components/AIAssistant.tsx`** (lines 21, 32)
- Remove or update the `/alpha` context references in `getContextLabel` and `getContextGreeting`

**`src/contexts/TourContext.tsx`** (lines 78, 84)
- Tour steps 12 and 13 currently target `/alpha`. Redirect these to the Landing page's Alpha section, or remove them and adjust step count. Since the Alpha page content (earnings calculator, fee text) won't exist at `/alpha`, these steps need new targets. Best approach: point both steps to the Landing page's dual CTA / Alpha section, updating selectors to match elements on that page, or consolidate into a single step on the landing page.

#### 2. Fix tooltip text (minor)

**`src/pages/StrategyDetail.tsx`** (line 165)
- Change "accept allocations" to "accept followers" in the validation tooltip

---

### Items Already Correctly Implemented (no changes needed)

- **1A-1C**: All terminology fixes (Follow modal, Built with labels, Marketplace banner)
- **2A-2C**: FAQ content (IP-Protected only, no consistency score, Manual tab reference kept)
- **3A-3F**: All visual fixes (orbs, glassmorphism, grid-cols-4, glow-commit, gem sizing)
- **4A-4D**: All interaction fixes (Go Live modal, dropdown menu, footer layout)
- **6A-6B**: Mock data (Pearl-217 and Ruby-891 have 5 holdings each, promotion logic uses creator_id check)

