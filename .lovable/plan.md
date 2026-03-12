

## Create Downloadable Site Map Document

I'll create a comprehensive site map as a downloadable Markdown file at `public/docs/alpha-trader-sitemap.md` that documents every page, its access level, available actions/commands, navigation links, tabs, modals, and user interactions.

### Content Structure

The document will cover all 13 routes with:
- **Page name and route**
- **Access level** (Public / Protected / Protected + Allow Expired Trial)
- **Available actions** (buttons, forms, filters, tabs, modals, sliders, toggles)
- **Navigation links** to other pages
- **Conditional states** (logged in vs out, owner vs visitor, basic vs pro, simulating vs live)

### Pages to Document

1. **`/` (Home)** - Conditional: Landing (guest) or Dashboard (authenticated)
2. **`/login`** - Login form with email/password
3. **`/signup`** - Two-step: credentials then plan selection
4. **`/docs`** - Download, copy link, open in new tab
5. **`/explore`** - Marketplace with filters, tabs (All Portfolios / Leaderboard), search
6. **`/alpha`** - Become an Alpha page with earnings calculator sliders, publishing requirements
7. **`/onboarding`** - Role selection, objective, risk slider, time horizon
8. **`/invest`** - Two tabs: AI-Assisted (conversational QA + animation + results) and Manual (form + holdings table)
9. **`/simulation/:id`** - Live chart, stop/resume, invest now, submit for validation, publish/keep private modals
10. **`/strategy/:id`** - 7 tabs, allocate modal, upgrade to pro modal, conditional owner/visitor views
11. **`/dashboard`** - 3 tabs, benchmark chart timeframe buttons, validated filter toggle, rebalancing settings modal, portfolio row clicks
12. **`/dashboard/portfolio/:id`** - Owner view with tweak modal (AI/manual), execute modal, make public modal, strategy controls (rebalance, pause, liquidate)
13. **`/*`** (404) - Back to home link

### Also Include
- **Navbar** actions (conditional on auth state)
- **Mermaid diagram** of the route/navigation graph
- A link to download this file from the Docs page

### Implementation
- Create `public/docs/alpha-trader-sitemap.md` with the full sitemap content
- Update the Docs page to also offer the sitemap for download

