# Decision 001 — Value Proposition: TruePackage vs LLMs

**Date:** 2026-10-02  
**Status:** Active  
**Author:** Supradeep

---

## Context

The primary objection from potential users is: *"I can do the same thing in a few prompts on ChatGPT or Claude."*

This document records the analysis of whether that objection is valid, and what the correct value proposition framing is.

---

## Is the objection valid?

Partially. An LLM can:
- Give a rough estimate of German net salary from a gross figure
- Provide general cost-of-living guidance for German cities
- List factors to consider when evaluating a relocation

An LLM cannot:
- Compute the correct number (LLM estimates are off by €200–500/month due to German tax complexity — Steuerklasse, Soli threshold, nursing care child factor, Beitragsbemessungsgrenze cap)
- Give a personalized parity threshold (your India CTC + your family + your city + your remittance → your Germany Number)
- Cross-reference financial threshold + market salary position in one view
- Let you slide the gross offer and watch all numbers update in real-time
- Share the result — LLM conversations aren't URLs

---

## The core distinction

**LLMs give information. TruePackage gives a decision.**

LLM answer to "is €70K in Munich enough?": *"It depends on your lifestyle and family situation. Munich is expensive..."*

TruePackage answer: *"Below parity. Counter at €76K minimum before signing."*

---

## Chosen value proposition framing

**Primary headline:**
> Everyone moving to Germany needs one number: the gross salary where the move makes financial sense for your life specifically. We calculate it in 60 seconds.

**Supporting proof points (in priority order):**

1. **Specificity** — Not "is €70K enough in Munich?" but "for a married person from Bangalore sending ₹50K/month, €70K is €8K below your parity threshold"
2. **Precision** — Actual 2026 Lohnsteuer tables, not approximations. €200-500/month difference at stake
3. **Speed at decision moment** — You get the offer email Friday 6pm with 48 hours to reply. 60 seconds vs 15 minutes of prompting
4. **Shareable** — Send the URL to your spouse before the negotiation call
5. **Takes a side** — "Accept" or "Counter at €X minimum" or "Do not accept" — not a hedge

---

## What to implement based on this analysis

### High priority (in-product changes)
- **Hero copy rewrite** — Replace form-first entry with decision-moment framing: *"You just got a Germany offer. Here's whether to accept it."*
- **vs-LLM callout inline** — In the tax breakdown card, show the LLM estimate vs actual: *"LLMs estimate ~€3,600 for this offer. Actual 2026 take-home: €3,847. The €247 difference is church tax and nursing care — details that matter."*
- **Share CTA** — "Send this to your partner" button that packages the URL + plain-text summary

### Medium priority
- **Counter email generator** — After the verdict, one-click generate the negotiation email using the actual numbers

---

## What TruePackage does NOT try to compete on

- Nuanced personal situations ("my mother is ill, does that change things?") → LLMs are better here
- Career trajectory advice → out of scope
- German labour law specifics → out of scope

The product is a financial decision engine, not a general Q&A tool.
