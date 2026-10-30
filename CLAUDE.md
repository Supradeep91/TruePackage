# TruePackage — Claude Code Project Guide

## What this product is

TruePackage is a financial decision calculator for Indian professionals evaluating Germany job offers, and German-based expats considering a return to India. It answers one question: **"Is this offer worth it — and exactly what number should I counter with?"**

**Two main flows:**
- **India → Germany (in2de):** Given a gross salary offer and Indian CTC, calculates real German net, parity/comfort thresholds, break-even timeline, first 6 months cash flow, and market position by profession/city/seniority.
- **Germany → India (de2in):** Given current German salary and an Indian CTC offer, calculates the lifestyle-match CTC needed to maintain Germany-level standard of living in the Indian city.

Additional flows: `opp` (opportunity/job-seeker mode), `student`.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite 6 |
| Language | TypeScript ~5.8 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Animation | Motion (Framer Motion v12) |
| AI | Google Gemini (via `/api/gemini` proxy) |
| Analytics | PostHog (EU cloud) |
| Deployment | Vercel |

## Running locally

```
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build
npm run lint       # TypeScript type-check (tsc --noEmit)
```

The Gemini API key is injected server-side via Vite's proxy (`/api/gemini`). Set `GEMINI_API_KEY` in `.env.local` for local AI features.

## Key files

| File | Purpose |
|---|---|
| [src/App.tsx](src/App.tsx) | Entire UI — all cards, state, layout (~2600 lines) |
| [src/calc/calcDE.ts](src/calc/calcDE.ts) | 2026 German tax + social contributions calculator |
| [src/calc/calcIN.ts](src/calc/calcIN.ts) | FY2025-26 Indian income tax calculator (new regime) |
| [src/calc/calcHelpers.ts](src/calc/calcHelpers.ts) | `calcThresholds`, `calcBreakEven`, `calcMatchCTC`, `calcOpp` |
| [src/data/cities.ts](src/data/cities.ts) | City cost-of-living data for 12 German + 13 Indian cities |
| [src/data/salaryRanges.ts](src/data/salaryRanges.ts) | Market salary ranges by profession × city × seniority |
| [src/hooks/useURLState.ts](src/hooks/useURLState.ts) | Encodes all calculator state into the URL for sharing |
| [docs/data-sources.md](docs/data-sources.md) | Every data point with source, URL, and verification date |
| [docs/decisions/](docs/decisions/) | Product and technical decision log (ADR-style) |

## Architecture decisions

**Single-file UI**: All cards and UI logic live in `src/App.tsx`. This was intentional — the product is a single-page calculator and splitting into many components added navigation cost without benefit. Refactor only if the file exceeds maintainability.

**URL state**: All calculator inputs are encoded in the URL via `useURLState`. This gives free sharing — users can send their exact calculation to a spouse or negotiation coach. No backend, no accounts.

**Tax precision**: `calcDE.ts` implements actual 2026 Lohnsteuer BMF tables, not approximations. Precision matters here — the difference between a rough estimate and the real net can be €200-500/month, a meaningful planning error for this decision.

**Inline Gemini prompts**: AI negotiation insights call Gemini directly from the client via a Vite proxy. Prompts are hardcoded in `App.tsx` near `runAI()`. Fallbacks exist for API failures.

**No accounts/persistence**: Stateless by design. State lives in the URL. The only persistence layer is PostHog analytics.

## Data update schedule

German tax tables: annually (January). City costs (Numbeo): quarterly. Indian city costs: quarterly. Salary ranges: annually (January-February). See [docs/data-sources.md](docs/data-sources.md) for the full source list.

## BMAD setup

BMAD method is installed via `.agents/skills/`. Installed modules:
- `bmad` — core advisor and setup
- `bmad-build` — feature build workflow (clarify → plan → implement → review)
- `bmad-ticket` — ticket/epic/story management
- `bmod-method` — product team personas (Mary/John/Sally/Winston/Amelia)
- `bmod-core-tools` — core utilities

Output artifacts go to `_bmad-output/`. Skills are pinned in `skills-lock.json`.

## Branch conventions

- `master` — production (auto-deploys to Vercel)
- `feature/session-N` — session-scoped feature branches

## What to avoid

- Do not expose the Gemini API key in client bundles — it is proxied server-side via `/api/gemini`
- Do not split `App.tsx` without a compelling reason — card components are intentionally co-located
- Do not approximate tax calculations — use `calcDE`/`calcIN` for any new salary math
- Do not commit `.claude/settings.local.json` — it contains machine-specific paths
