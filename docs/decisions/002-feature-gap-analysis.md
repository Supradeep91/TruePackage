# Decision 002 — Feature Gap Analysis: What Would Add Competitive Edge

**Date:** 2026-10-02  
**Status:** Active — informing roadmap  
**Author:** Supradeep

---

## Context

After establishing the value proposition (see [001](001-value-proposition.md)), this document records the analysis of gaps in the current product — features that would (a) deepen the moat vs LLMs and (b) solve real problems in the user journey that are currently unaddressed.

---

## User journey stages and gaps

### Stage 0: Before the offer exists (currently unserved)

**Target salary setter**  
User is browsing Germany jobs on LinkedIn and doesn't know what gross to filter for. TruePackage could give them their target gross before any offer exists. This is a massive untapped entry point — they'd bookmark the number and return when an offer lands.  
*Priority: High. LLM-proof (anchored, remembered number). Effort: Medium.*

**Blue Card threshold check**  
EU Blue Card in Germany requires minimum ~€45,552 gross (shortage occupations) or ~€58,400 (all others). Currently TruePackage checks financial viability but not visa eligibility. Combining both in one view would be the only tool to do so.  
*Priority: Medium. Effort: Low.*

---

### Stage 1: Evaluating the offer (mostly covered, key gaps)

**First-year tax refund**  
When joining mid-year (e.g., September), Germany taxes the salary assuming a full year of earnings but then refunds the overpayment at year-end. For a €75K offer joined in Q3: tax refund of ~€2,000–5,000 in the first tax return. This is counterintuitive, universally unknown, and not surfaced anywhere. Proactively showing this turns a perceived cost into a hidden benefit.  
*Priority: High. Effort: Low. Unique — no other tool surfaces this.*

**EUR/INR rate sensitivity**  
The parity threshold assumes today's EUR/INR rate. But the rate has moved from ₹80 → ₹93 in 5 years. For someone planning a 3–5 year stay, this is a planning variable, not a fixed input. A simple slider — "If INR weakens to ₹100: your threshold drops to €71K. If INR strengthens to ₹85: your threshold rises to €80K." — makes the calculation honest about its assumptions.  
*Priority: High. Effort: Low. LLM-proof (visual, interactive).*

**Multiple offer comparison**  
Users rarely have one offer. Currently you'd run TruePackage twice and mentally compare. A side-by-side panel (Offer A vs Offer B) with thresholds, net, and verdict instantly, encoded in the shared URL, solves a real frustration.  
*Priority: High. Effort: Medium.*

**Non-salary negotiation levers**  
Current verdict: "Counter at €76K." But what if they won't move? The next question is always "what else can I ask for?" Show quantified alternatives: *"€3,000 relocation bonus closes 40% of the gap. One extra WFH day saves €80/month."*  
*Priority: Medium. Effort: Low.*

---

### Stage 2: Exiting India (currently unserved)

**EPF / NPS / Gratuity on departure**  
When leaving India permanently, the user can withdraw PF corpus (after 2 months non-employment), claim gratuity (if 5+ years), and encash accrued leave. For someone with 7 years at a company this can be ₹8–15L sitting unclaimed. TruePackage could calculate: *"Before you leave, collect ₹X from PF + ₹Y gratuity. Here's the tax treatment."* No other tool addresses this.  
*Priority: High. Effort: Medium. Unique.*

---

### Stage 3: After moving (retention, currently unserved)

**Spouse income gap model**  
For married users, the period before the spouse finds work in Germany is the highest financial-risk window. Extend the break-even/cash-flow model to explicitly show: *"During months 1–6 on single income, your burn rate is €X and buffer is €Y."*  
*Priority: Medium. Effort: Medium.*

**Year 1 tax filing orientation**  
After the move, users return with German tax anxiety. A lightweight post-move guidance layer (what to file, what to claim, DTAA basics) converts a one-shot tool into an ongoing resource.  
*Priority: Low. Effort: Low.*

---

### Meta-gap: Memory / continuity

TruePackage is stateless — every visit starts over. This decision plays out over months (explore in January, offer in March, negotiate in April). The shared URL partially solves this but not the continuity problem. Even a "save and return" with no account (just a bookmark-able permalink that persists state beyond the session) would make TruePackage a companion across the decision timeline.  
*Priority: High. Effort: Medium.*

---

## Priority matrix

| Gap | Impact | Effort | LLM-proof | Build order |
|---|---|---|---|---|
| EUR/INR sensitivity slider | High | Low | Yes | 1 |
| First-year tax refund | High | Low | Yes | 2 |
| Target salary (pre-offer) | High | Medium | Yes | 3 |
| EPF/NPS/Gratuity | High | Medium | Yes | 4 |
| Multiple offer comparison | High | Medium | Yes | 5 |
| Saved calculation / permalink | High | Medium | Yes | 6 |
| Non-salary negotiation levers | Medium | Low | Partly | 7 |
| Spouse income gap | Medium | Medium | Yes | 8 |
| Blue Card threshold check | Medium | Low | Yes | 9 |
| Year 1 tax orientation | Low | Low | Partly | 10 |

---

## Gaps explicitly out of scope

- Multi-country comparison (Germany vs Netherlands vs UK) — too broad for v1
- German real estate vs renting — different audience segment
- Company quality/stability scoring — requires external data
- Career trajectory projection — requires LLM, not a calculator problem
