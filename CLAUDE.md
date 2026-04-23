# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

2026 NFL Draft Simulator — a full 7-round, 32-team mock draft with AI pick logic, combine data, trades, predictions, and grading. No frameworks; pure HTML/CSS/JS frontend with a Node.js/Express backend.

## Commands

```bash
npm start              # Run server on localhost:8080
npm run data           # Full data pipeline: extract → ML → update (regenerates data/prospects.json)
npm run extract        # Extract TOP_PROSPECTS + PROSPECT_UPDATES from app.js → data/seed-prospects.json
npm run ml             # Train combine→grade coefficient → data/ml-coefficients.json
npm run update         # Apply updates + ML + combine overrides → data/prospects.json
npm run import-combine # Import official combine results (JSON/CSV from stdin or file) → data/combine-overrides.json
```

There are no tests, no linter, and no build step.

## Architecture

### Data Flow

```
app.js (TOP_PROSPECTS, PROSPECT_UPDATES)
  → scripts/extract-seed.js → data/seed-prospects.json + data/prospect-updates.json
  → scripts/ml-combine-impact.js → data/ml-coefficients.json
  → scripts/update-data.js (merges combine-overrides.json + applies ML) → data/prospects.json
  → GET /api/prospects → frontend
```

The server runs this pipeline daily at 6am via cron, and on startup if `data/prospects.json` is missing.

### Frontend (public/)

- **app.js** (~1500 lines) — All game logic in one file. Key data structures:
  - `TEAMS` — 32 NFL teams with needs, colors, AI tendency profiles (`bpa`, `posPrefs`, `conf`)
  - `TOP_PROSPECTS` — ~50 hand-curated real prospects with scouting reports and optional `combine` objects
  - `PROSPECT_UPDATES` — Grade deltas from combine results, expert movement, news
  - `EXPERT_CONSENSUS_BIG_BOARD` — 32-name ordered array for predict mode and compare view
  - `ROUND1_PICKS` — Actual 2026 R1 draft order (some teams have 0 or 2 picks)
  - `pickOwnership[]` — Maps each of 224 picks to a team index (modified by trades)
  - `draftResults[]` — Completed picks with prospect, team, and grade
  - `seededRand(2026)` / `srand()` — Seeded PRNG for reproducible prospect generation and AI noise
- **auth.js** — Supabase auth, Stripe checkout, account screen, favourite team (localStorage)
- **news.js** — Per-team news feed with beat reporters, draft analysts, and RSS articles
- **index.html** — SPA with multiple screens toggled via `showScreen()`
- **styles.css** — NFL-themed dark mode, responsive

### Backend (server.js)

Express server serving static files + API routes:
- `GET /api/prospects` — Returns `data/prospects.json`
- `GET /api/news/:team` — RSS proxy (SB Nation blogs per team, avoids CORS)
- `GET /api/config` — Public Supabase/Stripe keys
- `POST /api/checkout` — Stripe checkout session
- `POST /api/stripe/webhook` — Stripe webhook (raw body, must be before `express.json()`)
- `GET/POST/DELETE /api/drafts/*` — Supabase CRUD for saved mock drafts
- `GET /api/subscription/:userId` — Check subscription status

Supabase and Stripe are both optional — server starts without them. Schema is in `setup.sql`.

### Scripts (scripts/)

- **extract-seed.js** — Parses `app.js` source code to extract `TOP_PROSPECTS` and `PROSPECT_UPDATES` as JSON. Uses bracket-matching, not regex.
- **ml-combine-impact.js** — Linear regression on historical combine + draft-round data. Outputs a single coefficient `k` where `gradeAdjustment = (combineScore - 50) * k`.
- **update-data.js** — Merges seed data + combine overrides + prospect updates + ML adjustment → final `data/prospects.json`.
- **import-combine.js** — Imports official combine results from JSON array or CSV. Merges into `data/combine-overrides.json`. Has `NAME_ALIASES` for common misspellings.

### Data Files (data/)

All generated; gitignored except `combine-overrides.json`. After modifying `TOP_PROSPECTS` or `PROSPECT_UPDATES` in `app.js`, run `npm run data` to regenerate.

## Key Conventions

- **Combine data**: Prospects with `combine: { _status: 'official', ... }` use real numbers and display "Official" in the UI. Others are generated estimates labeled "EST". DNP drills are `null` and show "DNP / Did not participate".
- **Prospect generation**: `generateProspects()` in app.js creates ~260 total prospects. The first ~50 are from `TOP_PROSPECTS` (real players); the rest are procedurally generated with fake names.
- **Draft order**: `ROUND1_PICKS` defines R1 pick ownership. ATL/GB/IND/JAX have no R1 picks; NYJ/DAL/LAR/KC have 2 each. Rounds 2-7 use array-index order.
- **AI scoring**: Picks are scored by grade (40%), team needs (30%), combine (15%), team tendencies (10%), and slide protection (5%). Each team has a `bpa` weight (0.3–0.7).
- **Seeded randomness**: Use `srand()` (seeded PRNG) for all randomness, not `Math.random()`.

## Environment Variables

All optional — app works without them:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `APP_URL` (for Stripe redirect URLs)
- `PORT` (default 8080)
