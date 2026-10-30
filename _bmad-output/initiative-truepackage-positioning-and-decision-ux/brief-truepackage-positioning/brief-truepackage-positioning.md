---
title: 'Product Brief: TruePackage Positioning and Decision UX'
status: draft
created: 2026-10-30
updated: 2026-10-30
---

# Product Brief: TruePackage Positioning and Decision UX

## Executive Summary

TruePackage helps people make financial decisions across the India↔Germany move journey. Visitors choose among moving to Germany for work, returning to India, studying in Germany, or job-seeking there; each path surfaces the main financial result, its assumptions, and a next action.

No lead segment is selected yet. Keep all four journeys available and instrument them separately; use interviews and product analytics to decide where to focus later.

The product should compete with general LLMs on workflow, not on claims that LLMs cannot calculate: no prompt design, journey-specific inputs, consistent scenarios, inspectable assumptions, and an action-oriented result. This is the intended product thesis, not a proven user preference. Launch success is first measured through comprehension and trust, then through completion and traction by journey. Monetization, including paid advisor help, is considered only after traction appears.

The source research and its caveats are in the [market research report](../../research-truepackage-india-to-germany-offer-tool/research-truepackage-india-to-germany-offer-tool.md).

## The Problem

People moving from India to Germany for work or study, searching for work in Germany, or returning to India from Germany face different versions of the same uncertainty: what the decision will mean for their real finances. Salary, tax, city costs, upfront funds, family support, and timing are often considered separately. Generic calculators and LLM conversations can help, but the person must know what inputs matter and reconcile the assumptions and outputs themselves.

The competitive scan found tools covering parts of this problem, including cross-country pay, tax, purchasing power parity (PPP), city costs, and non-resident Indian (NRI) context. It does not establish that users prefer TruePackage, or that LLMs fail at these tasks. Recent user interviews are still needed.

## Journeys and Outcomes

Offer four clearly named journeys, with one primary result and one next action per journey:

| Journey | User's decision | Desired outcome |
| --- | --- | --- |
| Work Move | Will this offer support my life in this city? | Monthly take-home, sustainable salary, and counter target |
| Return to India | What Indian compensation preserves the lifestyle I want? | A city- and lifestyle-matched CTC |
| Study in Germany | Which shortlisted program fits my priorities and is financially workable? | Evidence-backed comparison of course fit, outcomes, cost, work/internships, safety, and community, plus upfront funds and monthly funding gap |
| Job Search | What will the search/move require financially? | Upfront investment, runway, and target salary |

After a visitor chooses, show one concise result and a next action. Reveal tax lines, cost assumptions, and alternative scenarios progressively so users can inspect details without facing every input at once.

For Student, v1 compares programs the visitor has already shortlisted; it does not discover programs or submit applications. The owner’s retrospective experience used DAAD and conversations with seniors. Course fit was primary, with cost, outcomes, part-time work/internships, safety, and community also considered. This is one anecdote, not validated evidence of broader student preferences. A published default comparison method may be adjusted by the student, but its default weights must be validated before launch.

## What Makes This Different

The intended distinction is a guided, inspectable decision workflow: the right inputs for the selected journey, a consistent calculation, visible assumptions and data dates, and a clear next action. TruePackage should complement LLMs for open-ended follow-up rather than claim they are incapable or inaccurate.

This advantage must be earned. The current share button does not encode changed inputs into its URL, and the site's data-date label conflicts with the repository source register. Fix and verify these before promoting scenario sharing or freshness as proof points. Do not claim superior accuracy until the calculations have been checked against authoritative sources and compared with LLM outputs on the same tasks.

## Success Criteria

**First: trust and comprehension.** In moderated tests, users should be able to explain their main result, the assumptions that materially affect it, and the suggested next action. For Student, they should also understand the comparison factors, sources, weights, and evidence gaps. Establish baselines before setting numeric targets.

**Then: traction by journey.** Track calculation starts and completions separately for each journey, then compare each journey's completion rate instead of relying on one aggregate rate. Interview users to understand why a path succeeds or stalls.

**Later: monetization.** If one or more journeys show repeatable traction, test willingness to pay for related help, including advisor support. Do not build a paid service before that evidence.

## Scope

**In:** keep the four journeys; make the journey choice and its value clear on the first screen; show a concise primary result, a trust signal, and one next action; compare user-shortlisted study programs with sourced factors and a validated, adjustable default method; provide progressive detail; instrument outcomes by journey; align displayed data dates with the source register; and make shared scenarios reproduce their inputs.

**Out for this stage:** program discovery and applications; choosing a permanent lead segment before evidence; claiming TruePackage is more accurate than LLMs without a controlled test; adding monetization before traction; expanding beyond the India↔Germany decision space.

## Open Questions

- Which of the four journeys earns the strongest traction and trust?
- Which proof points matter most within each journey?
- What source-coverage rules and default student-comparison weights can be validated as credible?
- In a controlled task, is TruePackage faster or easier to inspect than an LLM or a combination of existing tools?
- Will users pay for advisor help after receiving the calculation?
- What measurable comprehension and trust thresholds should be set after baseline testing?

## Vision

Become the trusted decision workspace people return to as they move through major India↔Germany choices: considering a move, evaluating an offer, funding study or a job search, and planning a return. “Trusted” is the ambition; it must be demonstrated through understandable calculations, current sources, and user validation.
