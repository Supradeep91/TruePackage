---
title: 'Four-journey entry screen'
type: 'feature'
ticket: ''
created: '2026-10-30'
status: 'built'
baseline_revision: '98ee61343e77f67264118a21c8b8ca1f1a512d32'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'pinned'
lenses_ran: [quick]
review_loop_iteration: 0
context:
  - '_bmad-output/initiative-truepackage-positioning-and-decision-ux/brief-truepackage-positioning/brief-truepackage-positioning.md'
  - '_bmad-output/initiative-truepackage-positioning-and-decision-ux/prd-truepackage-decision-workflows/prd-truepackage-decision-workflows.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The entry screen presents the India-to-Germany work-offer case as the product's main purpose; the other three PRD Journeys are secondary header buttons. Visitors must infer which path fits their decision.

**Approach:** Give Work Move, Return to India, Study in Germany, and Job Search equal, clearly differentiated choices in the first-screen area. Selecting a choice uses the existing `dir` state and calculator scroll behavior.

</frozen-after-approval>

## Implementation Notes

Oneshot is appropriate because this is one small, single-file entry-screen change with an existing route state and no new service, dependency, or calculation. Keep all four current calculator flows and their financial logic intact. Preserve the existing local `.vscode/` and `_bmad/render/` files; do not stage or modify them.

- Replaced the work-offer-led hero with four equal journey buttons and a compact header shortcut in `src/App.tsx`; existing `dir` state, calculator transitions, and financial logic are unchanged.
- Added tablet/mobile reflow and moved the contact FAB into normal flow below 760px after browser checks found it covered journey content.
- Renamed the Study card kicker to “Plan study costs” so it matches the current Student funding estimator rather than implying program comparison is already available.
- Browser checks confirmed all four choices select the expected calculator heading; desktop and tablet use four/two columns respectively, and mobile has no horizontal overflow or FAB/card overlap.
- `npm run lint` remains blocked by three pre-existing TypeScript errors: two tuple casts in `src/App.tsx` and `this.props` in `src/main.tsx`. `npm run build` passes.
- Deferred custom journey analytics until Vercel event limits/cost are confirmed; deferred the Student program-comparison capability to its own PRD slice.

## Review Triage Log

- `medium / defer` — No custom per-Journey selection/completion events exist; `src/main.tsx` mounts Vercel Analytics and no `track` calls appear in `src/`. Recorded in `deferred-work.md` pending confirmation that instrumentation stays within the zero-spend constraint.
- `medium / patch` — The Study card's “Shortlisted programs” kicker implied comparison unavailable in the current estimator; changed to “Plan study costs” and confirmed the rendered card copy in the browser.

## Verification

**Commands:**
- `npm run build` -- expected: production build succeeds.

**Manual checks:**
- On desktop, all four journey choices are visible and receive comparable visual weight; on tablet and mobile, cards reflow without clipping or horizontal overflow.
- Keyboard users can focus and activate each choice.
- Each choice selects its existing journey, updates the matching calculator content, and scrolls to the calculator.
- Switching journeys does not alter calculator formulas or discard unrelated scenario inputs.
