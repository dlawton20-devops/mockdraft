# 2026 NFL Draft Simulator — Complete Guide

## Table of Contents

1. [Features Overview](#features-overview)
2. [Data Freshness & Update Strategy](#data-freshness--update-strategy)
3. [Architecture](#architecture)
4. [Combine Measurements](#combine-measurements)
5. [Trade System](#trade-system)
6. [Predict the Draft Mode](#predict-the-draft-mode)
7. [Draft Realism & Slide Protection](#draft-realism--slide-protection)
8. [Character Red Flags](#character-red-flags)
9. [Grading System](#grading-system)
10. [Hosting & Deployment](#hosting--deployment)
11. [Monetization Strategy](#monetization-strategy)
12. [User Accounts & Payment Processing](#user-accounts--payment-processing)
13. [Live News Feeds](#live-news-feeds)
14. [Legal Considerations](#legal-considerations)
15. [X/Twitter Marketing Strategy](#xtwitter-marketing-strategy)
16. [Updating Combine Data](#updating-combine-data)

---

## Data Sources & Accuracy

**This section is critical — be honest with your users about where data comes from.**

| Data | Source | Accuracy |
|------|--------|----------|
| Top 75+ prospect names, positions, schools | Real 2026 draft-eligible players | Accurate |
| Top 75+ scouting reports (bios, strengths, weaknesses) | Written based on publicly available film analysis and draft media coverage | Approximation — not sourced from any specific scout or publication |
| Combine athletic testing numbers | **Randomly generated** within position-typical ranges, adjusted by grade. **Official results** override when available (see `combine._status:'official'`). | Projected = labeled "EST"; official = labeled "Official" in the app |
| Generated prospects (#51-260) | Procedurally generated fake names, schools, and scouting reports | Fictional — labeled in the app |
| Team needs and draft order | Based on 2025-26 NFL season analysis | Approximation |
| ROSTER_LOCKS / ROSTER_EXPIRING | Manual — established starters vs contract/injury concerns | Update as news breaks (e.g. Seattle RB) |
| Team tendencies (BPA preference, position history) | Based on general team draft history | Approximation |
| Trade values | Jimmy Johnson trade value chart (simplified) | Standard industry model |
| Character red flags | Randomly assigned to ~10% of generated prospects | Fictional — for gameplay only |

**To make the app production-ready, you need to:**
1. Replace projected combine numbers with official results as they're released from [NFL.com/combine](https://www.nfl.com/combine/)
2. Verify/update scouting reports against current draft media (ESPN, The Athletic, NFL.com)
3. Update team needs based on free agency moves
4. Update draft order if trades happen before the draft

---

## Features Overview

### Three Modes
- **Draft for Your Team** — Select any NFL team and make all their picks across 7 rounds. Trade picks, use combine data, build your roster.
- **Full Mock Draft** — Watch the AI simulate all 224 picks with realistic BPA and team-need logic.
- **Predict the Draft** — Deterministic AI prediction using team needs, historical tendencies, combine measurables, and positional preferences. Every pick includes an AI-generated reason explaining the selection.

### Core Features
- 260+ prospects with bios, strengths, weaknesses, and combine measurements
- 7-round, 32-team draft with realistic pick order
- Trade system using the Jimmy Johnson trade value chart
- Grading system for individual picks and overall draft class
- Position-specific combine drills with DNP/opt-out support
- Character red flags that cause realistic draft slides
- Player profiles with full scouting reports

---

## Data Freshness & Update Strategy

The draft board moves constantly. Combine results, injuries, contract news, and expert opinions all shift rankings. This section describes how to keep the simulator current and how a more sophisticated (ML or data-driven) model could work.

### What Needs to Stay Current

| Input | Update Frequency | Sources |
|-------|------------------|---------|
| **Combine results** | As released (Combine week, Pro Days) | [NFL.com/combine](https://www.nfl.com/combine/), team reports |
| **Prospect grades** | Post-Combine, post-Pro Day, injury news | Expert big boards (see below) |
| **Team needs** | After free agency, trades | Roster analysis, beat writers |
| **Roster/contract status** | Ongoing | Spotrac, Over The Cap, team beat writers |

### Roster Nuance: Contract & Injury

The model distinguishes between:

- **`ROSTER_LOCKS`** — Positions where the team has an established star and will not draft early (e.g. Falcons RB with Bijan Robinson).
- **`ROSTER_EXPIRING`** — Positions where contract or injury creates need despite an incumbent (e.g. Seattle RB: Ken Walker unsigned, Charbonnet injured + 1 year left).

When a team is in `ROSTER_EXPIRING` for a position, the lock penalty is overridden and the team can draft there. Add teams/positions as news breaks:

```js
const ROSTER_EXPIRING = {
  SEA: ['RB']  // Ken Walker unsigned, Charbonnet injured + 1yr left
};
```

### Official Combine Overrides

Prospects with official combine data use it instead of projections. Add a `combine` object with `_status:'official'`:

```js
{ name:'Sonny Styles', pos:'LB', school:'Ohio State', grade:96,
  combine: { forty:4.46, bench:null, vert:43.5, broad:134, cone:7.09, shuttle:4.26, _status:'official' } }
```

`generateProspects()` preserves any `_status:'official'` combine; others are generated.

### Expert Sources to Monitor

Use these for grade adjustments and big-board movement:

| Expert | Outlet | Best For |
|--------|--------|----------|
| **Dane Brugler** | The Athletic | Big board, scouting reports, positional rankings |
| **Mel Kiper** | ESPN | Big board, mock drafts, QB/OL focus |
| **Todd McShay** | ESPN | Mock drafts, prospect comparisons |
| **Rob Staton** | Seahawks Draft Blog, Locked On | Seahawks-specific, deep dives |
| **Daniel Jeremiah** | NFL Network | Big board, combine analysis |
| **Lance Zierlein** | NFL.com | Scouting reports, draft profiles |

When experts move a prospect (e.g. Sonny Styles post-Combine), add an entry to `PROSPECT_UPDATES` (see below).

### PROSPECT_UPDATES Pipeline (Implemented)

The app applies grade deltas from `PROSPECT_UPDATES` when generating the board. Add entries when combine results, expert movement, or news warrant a bump or drop. Final grade = base grade (in `TOP_PROSPECTS`) + `delta`. Use negative deltas for slides (injury, poor testing, etc.).

### Historical Combine Comparables (Implemented)

**All prospects** (official or projected combine) show "Similar NFL Combine Performers" in their profile — e.g. Sonny Styles compares to Nick Emmanwori, Isaiah Simmons, Davis Tull. The `HISTORICAL_COMBINE` array holds past NFL players; `findCombineComparables()` scores similarity by forty, vertical, broad jump, and weight. Add more historical players to improve matches.

### Dynamic Data Pipeline & ML (Implemented)

**Data flow:** `app.js` → `scripts/extract-seed.js` → `data/seed-prospects.json` → `scripts/update-data.js` (applies PROSPECT_UPDATES + ML) → `data/prospects.json` → `GET /api/prospects` → frontend.

**Cron:** Daily at 6am the server runs the pipeline. **Manual:** `npm run data`.

**ML:** `scripts/ml-combine-impact.js` trains `gradeAdjustment = (combineScore - 50) * k` from historical combine + draft-round data. Prospects with combine data get this applied automatically.

**Future:** Expert consensus, contract feeds, news sentiment.


---

## Architecture

```
mockdraft/
├── public/
│   ├── index.html    — HTML structure (screens, modals, layout)
│   ├── styles.css    — NFL-themed dark mode stylesheet
│   └── app.js        — Logic, AI, trades, rendering; fetches /api/prospects
├── data/             — Generated by scripts (gitignored)
│   ├── seed-prospects.json
│   ├── prospect-updates.json
│   ├── ml-coefficients.json
│   └── prospects.json
├── scripts/
│   ├── extract-seed.js   — Extract TOP_PROSPECTS from app.js
│   ├── ml-combine-impact.js — Train combine→grade coefficient
│   └── update-data.js   — Apply updates + ML, write prospects.json
└── server.js         — Express, cron (daily 6am), /api/prospects
```

**Tech Stack:** Pure HTML/CSS/JS — no frameworks, no build step, no dependencies. Serves from any static file host.

**Key Data Structures:**
- `TEAMS` — 32 NFL teams with needs, colors, and AI tendency profiles
- `TOP_PROSPECTS` — ~50 hand-curated real 2026 prospects with detailed scouting reports
- `ALL_PROSPECTS` — 260 total prospects (50 real + 210 procedurally generated)
- `pickOwnership[]` — Maps each of the 224 picks to a team index (modified by trades)
- `draftResults[]` — Stores each completed pick with prospect, team, and grade

---

## Combine Measurements

### Data Accuracy Warning
**All athletic testing numbers are currently PROJECTED ESTIMATES, not official results.** They are generated within realistic position-average ranges and adjusted by prospect grade. They are clearly labeled as "Projected" with an "EST" tag on each measurement in the app.

The app is designed so you can plug in official results as they're released. See [Updating Combine Data](#updating-combine-data).

### Standard Athletic Testing
At the NFL Combine, **ALL position groups run ALL 6 standard athletic tests:**

| Drill | All Positions | Exception |
|-------|:---:|-----------|
| 40-Yard Dash | ✓ | — |
| Bench Press (225 lbs) | ✓ | QBs rarely participate |
| Vertical Jump | ✓ | — |
| Broad Jump | ✓ | — |
| 3-Cone Drill | ✓ | — |
| 20-Yard Shuttle | ✓ | — |

Individual players may opt out of any drill due to injury or preference to test at their Pro Day instead.

### Position-Specific On-Field Drills
In addition to athletic testing, each position group runs football-specific drills:

- **QB:** Throwing drills (short/intermediate/deep), accuracy on the move, footwork drops, red zone throws, scramble throws
- **RB:** Pass-catching, blitz pickup/pass protection, agility gauntlet, zone run footwork
- **WR:** Route running, gauntlet catching, contested catch, release drills, return skills
- **TE:** Route running, inline blocking, detached blocking, receiving drills
- **OT/IOL:** Pass-set and kick-slide, mirror drill, run-block footwork, pull and lead, combo blocks
- **EDGE:** Get-off and speed rush, bull rush/power, pass-rush counters, run defense hands, drop into coverage
- **DT:** Get-off and penetration, two-gap run defense, pass-rush hands, bull rush/swim, lateral movement
- **LB:** Coverage (man and zone), blitz timing, open-field tackling, block shedding, drop drills
- **CB:** Backpedal and break, press and re-route, transition drills, ball drills, tackling
- **S:** Backpedal and break, robber/cover-2 deep, box run support, blitz timing, ball-hawking drills

### Current Status
All measurements are marked **"Projected"** because the 2026 NFL Combine is in progress:

- Numbers are random within realistic position ranges, adjusted by prospect grade
- ~8-15% of prospects show **DNP** (Did Not Participate) for individual drills
- QBs don't bench press 225 lbs at the combine
- Higher-graded prospects tend to project better measurables

### How to Update with Real Data
See [Updating Combine Data](#updating-combine-data) section below.

### How Combine Influences the Draft
- A **Combine Score** (0-100) is calculated for each prospect based on their percentile in each drill
- The AI weighs combine performance at roughly 15-20% of the pick decision
- Outstanding combine (70+) can bump a player up 3-5 picks
- Poor combine (<35) can drop a player 3-5 picks
- This mirrors real NFL behavior where combine freaks rise and poor testers fall

---

## Trade System

### How It Works
When it's your pick in "Draft for Your Team" mode, a purple **Trade Pick** button appears.

**Trade Value Chart:** Uses a simplified version of the Jimmy Johnson chart:
```
Pick 1:   3000 pts
Pick 10:  2610 pts
Pick 32:  1906 pts
Pick 64:  1175 pts
Pick 100:  710 pts
Pick 150:  320 pts
Pick 224:  105 pts
```

**Trade Down:** You give your current (higher) pick and receive:
- A later pick in the same or next round
- An additional pick in a future round
- Total value received must be 85-140% of your pick's value

The AI evaluates fairness based on the trade value chart. If the math works, the trade shows up as an option.

### Limitations (current version)
- User-initiated only (AI doesn't propose trades to you)
- Trade down only (swapping your current pick for later picks)
- Max 6 trade offers shown per pick

### Future Improvements
- AI-initiated trade offers ("The Bears want to trade up for your pick")
- Trade up functionality (offer future picks to move up)
- Multi-team trades
- Trade pick swaps across rounds

---

## Predict the Draft Mode

### How the AI Predicts
The prediction algorithm scores each available prospect for each team using:

1. **Player Grade (40%)** — Raw talent/grade is the foundation
2. **Team Needs (30%)** — #1 need gets +16, #2 gets +12, #3 gets +7
3. **Combine Performance (15%)** — Outstanding combine adds up to +4
4. **Team Tendencies (10%)** — Historical preferences for positions and conferences
5. **BPA Weight** — Each team has a `bpa` tendency (0.3 to 0.7) that controls how much they value raw talent vs. need
6. **Slide Protection (5%)** — Prevents top talent from falling unrealistically

### Team Tendencies
Each team has a `tendency` object:
```javascript
{
  bpa: 0.7,              // 0.3 = need-based, 0.7 = BPA-heavy
  posPrefs: ['EDGE','OL'], // historically favored positions
  conf: 'Big Ten',        // conference draft preference
  tradeUp: false          // tendency to trade up (future use)
}
```

### Pick Reasoning
Every prediction includes an AI-generated explanation covering:
- **Need fit** — "QB is the LV's #1 need"
- **BPA value** — "Elite prospect ranked #1 overall (97 grade)"
- **Combine** — "Outstanding combine (75/100)"
- **Tendency match** — "Fits LV's historical draft preference for QB"
- **Value assessment** — "Significant value — slid 12 spots past expected range"
- **Red flags** — "⚠ Character questions may have caused a slide"

Click any pick row to expand and see the full reasoning.

---

## Draft Realism & Slide Protection

### The Problem
Without guardrails, the AI's need-weighting could cause a grade-97 player to fall to round 2 if no team in the top 15 has a matching positional need.

### The Solution
**Slide protection** adds escalating bonuses when elite talent falls past their expected draft position:

| Condition | Bonus |
|-----------|-------|
| Grade 93+ and slid 10+ spots | +25 |
| Grade 90+ and slid 15+ spots | +20 |
| Any player slid 6+ spots | +(slide - 6) × 3 per spot |
| Any player slid 14+ spots | +(slide - 14) × 5 per spot |

**Result:** Top-10 graded prospects stay in round 1. A grade-96 RB (like Jeremiyah Love) might fall to pick 12-15 because RB isn't a premium need for most teams — which is realistic — but won't fall to round 2.

---

## Character Red Flags

~10% of generated prospects have one of these flags:
- Off-field concerns
- Injury history
- Character questions
- Maturity concerns
- Failed team interviews
- Medical red flag
- Work ethic questions
- Off-field incident

**Impact:** Red-flagged players receive a -8 to -14 point penalty in AI scoring. This causes them to fall in the draft despite their talent grade, which the prediction reasoning will explain.

Red flags show up:
- In the prospect list (draft screen) as a red warning tag
- In the player profile modal as a highlighted alert box
- In prediction reasons when explaining a fall

---

## Grading System

### Individual Pick Grades
Each pick is graded A+ through D- based on:
- **Value** — Was the player picked above or below their ranking? (`(pickNum - rank) × 1.5`)
- **Need fit** — Does the player fill a team need? (+14 for #1 need, +10 for #2, +6 for #3)
- **Combine bonus** — Better combine performance adds up to +3

### Overall Team Grade
Averages all individual pick grades for the team's draft class.

### Grade Scale
| Grade | Score Range |
|-------|-------------|
| A+ | 72+ |
| A | 65-71 |
| A- | 58-64 |
| B+ | 51-57 |
| B | 45-50 |
| B- | 39-44 |
| C+ | 33-38 |
| C | 27-32 |
| C- | 21-26 |
| D+ | 15-20 |
| D | 9-14 |
| D- | Below 9 |

---

## Hosting & Deployment

### Free Static Hosting (Current Version)

The app is pure HTML/CSS/JS — no server needed.

**Option A: Vercel (Recommended)**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Import Project" → select your repo
4. Deploy. You get a URL like `mockdraft.vercel.app`
5. Add a custom domain in settings

**Option B: Netlify**
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in with GitHub
3. Click "New site from Git" → select repo
4. Deploy. You get `mockdraft.netlify.app`

**Option C: GitHub Pages**
1. In your GitHub repo, go to Settings → Pages
2. Set source to "main" branch
3. Site publishes at `username.github.io/mockdraft`

**Custom Domain:**
- Buy from Namecheap, Google Domains, or Cloudflare (~$10-15/year)
- Good names: `mockdraftsim.com`, `prodrafthq.com`, `draftdaysim.com`
- Point DNS to your hosting provider (Vercel/Netlify have guides)

### Full-Stack Hosting (With Accounts/Payments)

Once you add user accounts and payments, you need a backend:

**Recommended: Vercel + Supabase**
- Frontend: Vercel (free)
- Database + Auth: Supabase (free tier: 500MB, 50K monthly active users)
- Payments: Stripe (pay-per-transaction)

**Alternative: Railway or Render**
- Full Node.js server hosting
- Free tier available, paid starts at ~$5/month

---

## Monetization Strategy

### Revenue Streams

#### 1. Advertising (Easiest, Lowest Effort)
- **Google AdSense** — Banner ads above/below draft board
- Sports content CPMs during draft season: $5-15 CPM
- 10K monthly visits × $10 CPM = ~$100/month
- 100K monthly visits = ~$1,000/month
- Peak traffic: March-April (combine through draft)

#### 2. Premium Subscription ($10/month or $10 one-time)
Gate these features behind a paywall:
- Save and view mock draft history
- Export drafts as shareable images/PDFs
- Detailed team analytics and comparisons
- Custom trade packages (trade up, multi-team deals)
- Dynasty/keeper league mode
- Real-time news feed for favorite team
- Ad-free experience

#### 3. Affiliate Marketing
- Link to sportsbooks (DraftKings, FanDuel affiliate programs pay $50-200 per signup)
- NFL Shop merchandise links (4-8% commission)
- Draft guide books on Amazon (affiliate links)
- Fantasy sports platform referrals

#### 4. Sponsorships (Once You Have Traffic)
- Fantasy sports platforms
- Sports betting companies
- Football content creators
- Direct display ad deals ($500-5,000/month for prominent placement)

### Pricing Strategy
- **Free tier:** 1 mock draft per day, basic features, ads shown
- **Premium ($10/month or $29/year):** Unlimited mocks, saved history, news feed, no ads, advanced features
- **Consider:** $10 one-time for lifetime access (lower barrier, good for viral growth)

---

## User Accounts & Payment Processing

### Tech Stack for Accounts

#### Option A: Supabase (Recommended — Easiest)
```
Supabase provides:
├── PostgreSQL database (free: 500MB)
├── Built-in auth (email/password, Google, GitHub)
├── REST API (auto-generated from your tables)
├── Row-level security (users only see their data)
└── Real-time subscriptions
```

**Database Schema:**
```sql
-- Users (handled by Supabase Auth)

-- Saved mock drafts
CREATE TABLE mock_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  mode TEXT, -- 'manual', 'auto', 'predict'
  team_abbr TEXT, -- user's selected team (null for auto/predict)
  overall_grade TEXT,
  results JSONB, -- full draft results as JSON
  trade_log JSONB
);

-- Favorite teams
CREATE TABLE favorite_teams (
  user_id UUID REFERENCES auth.users(id),
  team_abbr TEXT,
  PRIMARY KEY (user_id, team_abbr)
);
```

**Setup Time:** 2-3 hours for basic auth + draft saving.

#### Option B: Firebase
Similar to Supabase but uses NoSQL (Firestore). Good if you prefer Google ecosystem.

### Payment Processing

#### Stripe (Recommended)
1. Create account at [stripe.com](https://stripe.com)
2. Use **Stripe Checkout** — hosted payment page, no PCI compliance headaches
3. Flow:
   ```
   User clicks "Subscribe" on your site
   → Redirected to Stripe Checkout page
   → Pays $10 (card, Apple Pay, Google Pay)
   → Stripe redirects back to your site with session ID
   → Your server receives webhook confirming payment
   → Update user's subscription_status in database
   ```
4. Stripe takes 2.9% + $0.30 per transaction
5. On a $10 payment, you keep ~$9.41
6. Handles GBP, EUR, and 135+ currencies automatically
7. Handles tax/VAT compliance

**Stripe Checkout code (simplified):**
```javascript
// Server-side (Node.js)
const stripe = require('stripe')('sk_live_...');

app.post('/create-checkout', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', // or 'payment' for one-time
    line_items: [{
      price: 'price_xxxxx', // your $10/month price ID from Stripe dashboard
      quantity: 1,
    }],
    success_url: 'https://yoursite.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://yoursite.com/pricing',
  });
  res.json({ url: session.url });
});
```

#### Simpler Alternative: Lemon Squeezy
- No backend code needed — they handle everything
- Hosted checkout, subscription management, tax compliance
- 5% + $0.50 per transaction (higher fee, but zero setup)
- Perfect if you want to launch fast without building a backend
- [lemonsqueezy.com](https://lemonsqueezy.com)

### VAT/Tax Considerations
- UK digital goods require VAT (20%) to be charged to UK customers
- EU has similar rules
- **Stripe Tax** or **Lemon Squeezy** handle this automatically
- They calculate, collect, and remit the correct tax based on the customer's location
- This is important — non-compliance can result in fines

---

## Live News Feeds

### Legal Approaches (Won't Get You Sued)

#### 1. Twitter/X Embedded Timelines (Safest)
Create a Twitter List of team-specific accounts and embed it:
```html
<!-- Example: Seahawks news feed -->
<a class="twitter-timeline"
   href="https://twitter.com/i/lists/YOUR_LIST_ID"
   data-theme="dark"
   data-height="600">
  Seahawks Draft News
</a>
<script src="https://platform.twitter.com/widgets.js"></script>
```

**Per-team lists might include:**
- Team's official account (@Seahawks)
- Beat reporters (@bcondotta, @Seahawks_Insider)
- Draft-specific bloggers (@HawkBlogger)
- Team-focused podcasters

This is **100% sanctioned** by X's terms of service — it's their official embed widget.

#### 2. RSS Feed Aggregation
Many blogs publish RSS feeds. You can legally display:
- **Headline** (title)
- **1-2 sentence excerpt** (usually included in the RSS)
- **Link to the full article** on their site
- **Publication date and source attribution**

**Example sources with RSS:**
- Field Gulls (SB Nation): `fieldgulls.com/rss/current`
- Most WordPress blogs have `/feed/` endpoints
- ESPN RSS feeds are available

**What NOT to do:**
- Don't copy full article text
- Don't remove attribution
- Don't present their content as yours

#### 3. Custom News API
Use a news API service:
- **NewsAPI.org** — Free for development, $449/month for production
- **GNews.io** — Free tier: 100 requests/day
- Filter by team name + "NFL draft"

### Implementation
```javascript
// Pseudo-code for team news page
async function loadTeamNews(teamName) {
  // Option 1: Embed Twitter list
  renderTwitterEmbed(teamListIds[teamName]);

  // Option 2: Fetch RSS
  const rss = await fetch(`/api/rss?team=${teamName}`);
  const articles = parseRSS(rss);
  articles.forEach(a => renderArticleCard(a.title, a.link, a.date, a.source));
}
```

---

## Legal Considerations

### What's Safe
| Element | Status | Notes |
|---------|--------|-------|
| Team abbreviations (LV, SEA) | ✅ Safe | Factual data |
| Team colors | ✅ Safe | Not copyrightable |
| Team city + name (Seattle Seahawks) | ⚠️ Use carefully | Fine in editorial/informational context |
| Player names | ✅ Safe | Public figures, factual use in a simulator |
| Team logos | ❌ Don't use | Trademarked — use abbreviation badges instead |
| "NFL" in your product name | ❌ Don't use | Don't imply official affiliation |
| NFL shield logo | ❌ Don't use | Trademarked |
| Player photos | ❌ Don't use | Require licensing |
| Scouting reports (your own words) | ✅ Safe | Original analysis |
| Combine measurements (when official) | ✅ Safe | Factual data, publicly reported |

### Required Disclaimers
Add this to your footer:
> This is an independent fan-made draft simulator for entertainment purposes only. It is not affiliated with, endorsed by, or connected to the National Football League (NFL) or any NFL team. Team names and player names are used for informational purposes only.

### Terms of Service
Add a basic ToS covering:
- Subscriptions and refund policy
- Data is for entertainment only
- You reserve the right to modify features
- Use a free generator: [Termly.io](https://termly.io) or [TermsFeed](https://termsfeed.com)

### Privacy Policy
Required if you collect any user data (emails, payments):
- What data you collect
- How you use it
- Third parties you share with (Stripe, Supabase)
- GDPR compliance for EU users
- Use Termly.io to generate one for free

### DMCA / Content Takedowns
If a blog owner asks you to remove their RSS content from your feed, **do it immediately**. Having a clear process for takedown requests protects you.

---

## X/Twitter Marketing Strategy

### Account Setup
- **Handle:** `@MockDraftSim` or `@DraftSimHQ` or `@ProDraftSim`
- **Bio:** "AI-powered NFL Draft Simulator with combine data, trades & predictions. Run your own mock draft for free."
- **Link:** Your site URL
- **Banner:** Screenshot of the app showing a mock draft in progress

### Content Calendar

| Time | Content Type | Example |
|------|-------------|---------|
| Daily 8 AM ET | AI Mock Draft | "Today's AI Mock Draft — Top 10 Picks: 1. LV: Mendoza (QB) 2. NYJ: McCoy (CB)... Full interactive mock: [link]" |
| Daily 6 PM ET | Engagement post | "The Raiders take Mendoza at #1 in our AI mock. Do you agree? Who would you take?" |
| After combine events | Combine reaction | "Biggest combine risers after Day 2: [player] ran a 4.33 forty. Updated mock draft →" |
| Weekly | Draft grade comparison | "Which team had the best AI-predicted draft class? Full grades →" |
| Weekly | Poll | "Should the Jets draft a QB or CB at #2? Vote below, then try it yourself →" |

### Hashtags
`#NFLDraft` `#MockDraft` `#NFL` `#NFLCombine` `#DraftSzn` `#NFL2026Draft`

### Automation (Advanced)
Use a cron job + Puppeteer + X API to auto-post daily:
1. Puppeteer loads your site, runs predict mode
2. Takes a screenshot of the round 1 results
3. X API v2 posts the image with caption
4. Runs daily at 8 AM ET via GitHub Actions or a cron service

```yaml
# .github/workflows/daily-mock.yml
name: Daily Mock Draft Post
on:
  schedule:
    - cron: '0 13 * * *'  # 1 PM UTC = 8 AM ET
jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install puppeteer
      - run: node scripts/generate-and-post.js
```

### Growth Strategy
1. **Launch during Combine week** (NOW) — peak mock draft interest
2. **Engage with NFL draft Twitter** — reply to big accounts, quote tweet combine results
3. **Create shareable content** — Let users screenshot/share their mock draft results
4. **Partner with small draft podcasts** — offer them a shoutout in exchange for mention
5. **Reddit posts** — Share in r/NFL_Draft, r/nfl (follow self-promotion rules)
6. **Cross-post to Instagram/TikTok** — Short video of the mock draft running with voiceover

---

## Updating Combine Data

### When Official Results Come In
As the 2026 NFL Combine releases official numbers, update the top prospects in `app.js`:

1. Find the prospect in the `TOP_PROSPECTS` array
2. Add a `combine` property with official measurements
3. Change `_status` to `'official'`

**Example: Updating Fernando Mendoza's combine data:**
```javascript
// In TOP_PROSPECTS array, add a combine field:
{
  name: 'Fernando Mendoza', pos: 'QB', school: 'Indiana', grade: 97,
  // ... existing bio, strengths, weaknesses ...
  officialCombine: {
    forty: 4.68,     // Official 40 time
    bench: null,      // QBs don't bench
    vert: 34.5,       // Official vertical
    broad: 116,       // Official broad jump
    cone: null,        // QBs don't run 3-cone
    shuttle: 4.22,    // Official shuttle
    _status: 'official'
  }
}
```

Then modify `generateProspects()` to use `officialCombine` when available:
```javascript
ALL_PROSPECTS = TOP_PROSPECTS.map(p => {
  const bonus = (p.grade - 80) / 3;
  const combine = p.officialCombine || genCombine(p.pos, bonus, true);
  return { ...p, id: p.name.replace(/\s/g,'-').toLowerCase(), combine };
});
```

### Data Sources for Official Results
- [NFL.com/combine](https://www.nfl.com/combine/) — Official results
- [NFL Combine Results on ESPN](https://www.espn.com/nfl/draft/combine)
- [MockDraftable](https://www.mockdraftable.com/) — Historical combine data with percentiles
- Team beat reporters on Twitter — often tweet results in real-time

### Keeping Projected Data Honest
The current projected measurements are generated within realistic position-typical ranges. They're not guesses at specific players' numbers — they're plausible estimates based on:
- Position-average combine ranges from historical NFL data
- Grade-correlated performance (better prospects tend to test better)
- Random variation within the realistic range

This is clearly labeled as "Projected" in the UI with a disclaimer explaining the combine is ongoing.

---

## Quick Launch Checklist

- [ ] Push code to GitHub
- [ ] Deploy to Vercel (free)
- [ ] Buy a domain (~$10/year)
- [ ] Create X/Twitter account
- [ ] Add footer disclaimer
- [ ] Start posting daily mock drafts
- [ ] Update combine data as results come in
- [ ] (Later) Add Supabase for user accounts
- [ ] (Later) Add Stripe/Lemon Squeezy for payments
- [ ] (Later) Add RSS-based news feeds
- [ ] (Later) Add Terms of Service and Privacy Policy
