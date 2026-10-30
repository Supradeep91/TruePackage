---
title: 'PRD: TruePackage Decision Workflows'
status: draft
created: 2026-10-30
updated: 2026-10-30
---

# PRD: TruePackage Decision Workflows

**Scope status:** No lead Journey is selected before the learning experiment in §6.1 provides sufficient evidence.

## 0. Document Purpose

This PRD is for product, design, data, and engineering contributors building TruePackage's public India↔Germany decision workflows. It turns the approved Product Brief into capabilities and testable requirements without prescribing implementation architecture. Source documents: [Product Brief](../brief-truepackage-positioning/brief-truepackage-positioning.md), [market research](../../research-truepackage-india-to-germany-offer-tool/research-truepackage-india-to-germany-offer-tool.md), [data and evidence addendum](addendum.md), [Product Brief reconciliation](reconcile-product-brief.md), and [market research reconciliation](reconcile-market-research.md).

The Student journey includes the approved shortlisted-program comparison and is aligned with the updated Product Brief.

## 1. Vision

TruePackage is a guided, inspectable decision tool for people making financial decisions across the India↔Germany journey. It asks for information relevant to a selected situation, produces a usable result and next step, and lets people inspect the assumptions and sources behind it.

The product supports four decisions: whether a German work offer is sustainable, what Indian CTC supports a return lifestyle, which shortlisted study option fits a student's priorities and finances, and how much money a Germany job search requires. TruePackage competes with LLMs on structured workflow and evidence visibility, not on a claim that LLMs cannot calculate. Accuracy superiority is not claimed until measured against authoritative sources and a controlled comparison.

### Market Context

Net-pay, PPP, city-cost, and India/Germany comparison features already exist in other products. TruePackage's integrated workflow is a hypothesis to test, not an exclusive feature claim. Recent user evidence is limited to owner-reported anecdotes; the market scan could not validate segment preference.

## 2. Target User

### 2.1 Jobs To Be Done

- **Work mover:** Understand likely monthly take-home and whether a Germany offer works for a chosen city and personal situation; decide whether to leave and what to negotiate.
- **Returner:** Compare current Germany circumstances with a target Indian city and estimate the CTC needed for the desired lifestyle.
- **Student:** Compare shortlisted German programs across course fit, outcomes, affordability, work opportunities, safety, and community using inspectable evidence; plan funding.
- **Job seeker:** Estimate upfront investment, likely runway in a chosen city, and target salary before committing to a Germany job search.

### 2.2 Non-Users (v1)

- People asking TruePackage to submit university applications, assess admission eligibility, place them in jobs, or guarantee a visa, internship, job, or personal safety.
- People comparing countries outside the India↔Germany corridor.
- Students seeking a from-scratch university/program discovery catalog; v1 compares programs the student has already shortlisted.

### 2.3 Key User Journeys

**[ASSUMPTION: pseudonym]** Names below are pseudonyms or illustrative placeholders. The work-offer trigger and the owner's retrospective study comparison are based on personal anecdotes. **[ASSUMPTION: unvalidated Journeys]** The returner and job-seeker stories are hypotheses to validate.

- **UJ-1. Asha evaluates a Germany offer before leaving India.**
  - **Persona + context:** Asha (pseudonym), an India-based professional with a Germany job offer; the owner has heard this question from friends.
  - **Entry state:** She knows the German offer salary, German city, and her current Indian salary. She asks whether the offer is worth leaving her current situation for and whether she should negotiate.
  - **Decision:** Assess whether the offer justifies leaving her current situation and what to negotiate; see FR-3 and FR-4 for inputs and outputs.
  - **Resolution:** TruePackage informs, but does not make, her leave/stay decision.
  - **Evidence limit:** The historic advice was based on the owner's experience, not a standardized calculation. Specific salary, city, household, and final outcome were not provided.

- **UJ-2. Neha compares a return offer with her Germany lifestyle.**
  - **Persona + context:** Neha (illustrative, unvalidated), a Germany-based professional considering a return to India. **[ASSUMPTION: unvalidated Journeys]**
  - **Decision:** Does the proposed CTC support the lifestyle she wants in her chosen Indian city?
  - **Climax:** She sees the lifestyle-matched CTC and the gap from the offer; detailed inputs are specified in FR-5.
  - **Resolution:** She decides whether to negotiate, change the target city/lifestyle, or continue evaluating the return. **[ASSUMPTION: exact inputs and next action require user research.]**

- **UJ-3. Sana compares shortlisted German master's programs.**
  - **Persona + context:** Sana (pseudonym for the owner's retrospective student experience), an Indian student comparing German university options. Course fit was primary; cost, part-time work/internships, friends/community, safety, reputation, and outcomes also mattered.
  - **Entry state:** She has shortlisted at least two programs. In her past search, she used DAAD and asked seniors at the universities.
  - **Decision:** Compare the shortlisted programs against her priorities; see FR-6 through FR-9 for details.
  - **Climax:** She can explain which factors drove the recommendation and where evidence is incomplete.
  - **Resolution:** She chooses a preferred program or identifies what to verify, then reviews upfront funds and the monthly funding gap.
  - **Evidence limit:** The owner used DAAD and conversations with seniors. No particular program, final choice, or observed use of a comparison tool was supplied.

- **UJ-4. Kabir assesses the cost of a Germany job search.**
  - **Persona + context:** Kabir (illustrative, unvalidated), a job seeker considering a Germany search. **[ASSUMPTION: unvalidated Journeys]**
  - **Decision:** How much upfront funding and runway are needed to search from his chosen city?
  - **Climax:** He sees his estimated runway and target salary; detailed inputs and outputs are specified in FR-10.
  - **Resolution:** He decides whether to proceed, increase funds, or adjust the city/search plan. TruePackage does not guarantee a job. **[ASSUMPTION: exact inputs and next action require user research.]**

## 3. Glossary

- **Journey** — One of the four user-selected decision paths: Work Move, Return to India, Study in Germany, or Job Search.
- **Scenario** — User-provided inputs used for one calculation or comparison.
- **Net monthly income** — Estimated monthly take-home after applicable deductions; distinct from gross compensation and annual tax liability.
- **Sustainable salary threshold** — Estimated gross annual compensation that meets the selected work-move Scenario's stated costs and commitments. It is an estimate, not financial advice.
- **Counter target** — Negotiation figure shown separately from the Sustainable salary threshold and from any user-defined walk-away minimum.
- **Shortlisted program** — University/program selected by the student for comparison; TruePackage v1 does not discover programs from scratch.
- **Default weighting method** — Published starting weights used to summarize student comparison factors.
- **Custom weights** — Factor priorities the student changes for their comparison.
- **Source coverage** — Availability, freshness, and geographic/program specificity of the evidence supporting a factor.
- **Offer gap** — Difference between offered compensation and the Sustainable salary threshold for a Scenario.

## 4. Features

### 4.1 Journey Selection and Result Structure

**Description:** A visitor chooses one of four equally represented Journeys. The product shows the result relevant to that Journey, plus a trust signal and one next action. Supporting details are progressively disclosed.

**Functional Requirements:**

#### FR-1: Select a Journey

A visitor can select Work Move, Return to India, Study in Germany, or Job Search before entering Journey-specific inputs. The Job Search route replaces the current “Job Hunt Visa” label so the journey is not mistaken for visa guidance only. Realizes UJ-1 through UJ-4.

**Consequences (testable):**
- Each of the four canonical Journey labels is discoverable from the public entry point and has a distinct description.
- The four routes receive comparable exposure and instrumentation for the learning period.
- Selecting a Journey shows relevant inputs and results; users can return to the Journey selector without losing their current Scenario.

#### FR-2: Present a concise result with evidence

For each Journey, the system shows one primary result, a short explanation, one next action, and a way to inspect material assumptions and sources. Realizes UJ-1 through UJ-4.

**Consequences (testable):**
- In usability testing, users can identify the primary result and next action without opening every detail section.
- Material detail is available on demand without requiring every user to process all calculations at once.

### 4.2 Work Offer Evaluation: India to Germany

**Description:** Help a user assess a specific German offer against current Indian compensation, chosen city, and stated commitments. The result informs—but does not make—the leave/stay decision. Realizes UJ-1.

#### FR-3: Evaluate offer sustainability

The user can enter current Indian compensation, offered German gross salary, and German city, with optional household, remittance, and monthly-commitment details. The system presents estimated Net monthly income, estimated Scenario costs, Sustainable salary threshold, and Offer gap using the applicable calculation year and visible assumptions.

**Consequences (testable):**
- The result distinguishes gross annual salary, Net monthly income, and estimated costs.
- Changing a relevant input updates the displayed result consistently.
- Missing optional inputs are identified as assumptions, not treated as user-provided facts.

#### FR-4: Show negotiation context without conflating thresholds

The system can show a Counter target where supported by the Scenario, separately labeled from the Sustainable salary threshold and any user-defined walk-away minimum.

**Consequences (testable):**
- Result language does not simultaneously tell the user to accept and counter without explaining the conditions.
- The system does not call a Counter target a minimum-to-accept unless the calculation and definition support that interpretation.
- Current UI copy mixes “Good offer — counter” with “Accept. Counter …”; revised copy presents one unambiguous status and action.

### 4.3 Return-to-India Evaluation: Germany to India

**Description:** Help a Germany-based user compare current circumstances with a chosen Indian city and offer. Realizes UJ-2.

#### FR-5: Estimate lifestyle-matched Indian compensation

The user can enter current Germany compensation and context, select an Indian city, and enter or compare an Indian CTC. The system displays the estimated CTC needed for the selected lifestyle and the difference between that target and the offer, with assumptions visible.

**Consequences (testable):**
- The result distinguishes an estimated lifestyle-match target from the actual offer and take-home pay.
- A changed city or material lifestyle assumption updates the target and shows which inputs changed it.

### 4.4 Student Comparison: Shortlisted German Programs

**Description:** Help a student compare at least two Shortlisted programs across academic fit, outcomes, affordability, work opportunities, safety, and community. The product does not discover programs in v1. The Default weighting method and Custom weights must be transparent; the launch gate is defined in §7.1. Realizes UJ-3.

#### FR-6: Compare Shortlisted programs

The student can provide at least two Shortlisted programs and the relevant city or campus. The system presents a side-by-side comparison for course/program fit and quality, graduate outcomes, total cost, signals about part-time work and internships, safety evidence, and community/support context.

**Consequences (testable):**
- The comparison distinguishes institution/program facts, user-entered preferences, and external indicators.
- Graduate outcome data identifies the metric, cohort/year, denominator, source, and whether it is institution-reported. Do not compare outcome values across programs unless definitions are comparable; missing or non-comparable data is marked unavailable.
- The product does not imply that listed opportunities guarantee admission, work, internships, safety, or social connection.
- Program discovery and application submission are not required to complete the comparison.

#### FR-7: Explain the student comparison score

The system presents a published Default weighting method and permits the student to adjust Custom weights. The interface shows factor-level results and explains how weights affect the overall recommendation.

**Consequences (testable):**
- The Default weighting method, factor definitions, weighting, and limitations are visible before the student relies on the recommendation.
- The user can restore defaults after changing Custom weights.

#### FR-8: Show student funding requirements

For a selected Shortlisted program/city, the system estimates upfront funds and the monthly funding gap using known savings, family support, costs, and applicable official requirements.

**Consequences (testable):**
- The result separates one-time costs, recurring costs, available funds, and funding gaps.
- Official requirements are labeled with jurisdiction, effective date, and source; expired or unverified requirements are not presented as current.

#### FR-9: Handle incomplete or stale comparison evidence

The system shows source, date, location/program coverage, and uncertainty for material comparison factors. It identifies missing or stale evidence and applies the published scoring policy without silently fabricating or imputing values.

**Consequences (testable):**
- Users can open the source for every scored factor.
- The system calculates an overall score only if every non-zero-weighted factor has current, comparable evidence for each option, supported by a source or user-entered value. Otherwise, it shows the factor-level comparison, withholds the overall score, and explains which inputs are missing or stale.

### 4.5 Job-Search Investment and Runway

**Description:** Help a person considering a Germany job search estimate funds required and how long available resources may last in a chosen city. Realizes UJ-4.

#### FR-10: Estimate upfront investment and runway

The user can enter a target city, available liquid savings, and relevant monthly cost/support assumptions. The system presents upfront funds required, estimated monthly burn, runway, and a target salary or next financial milestone where supported.

**Consequences (testable):**
- One-time blocked funds are separated from liquid savings and recurring expenses.
- The result shows which assumptions most affect runway.
- The result does not imply that reaching a target salary guarantees a job.

### 4.6 Trust, Sharing, and Measurement

**Description:** Users need to understand how results are derived; the product needs to learn which Journeys work without collecting unnecessary financial data.

#### FR-11: Show calculation provenance

For material financial and comparison results, the system shows data year/date, source, applicable geography, and material assumptions. Where a claim is an estimate, the interface labels it as such.

**Consequences (testable):**
- Before release, document what each data date represents and revalidate source values against their update cadence. Current baseline says “Data: June 2026” in the footer and “Last updated: March 2026” in the source register; align the footer, source details, and register.
- A displayed take-home percentage is calculated for the displayed Scenario; the current 52–57% hero claim and 49% example must not appear contradictory.
- Every recommendation factor is traceable to a source or labeled as an estimate/user input.

#### FR-12: Share a reproducible Scenario by user action

The user can explicitly share a Scenario and, when opened, the shared Scenario reproduces the relevant Journey and inputs. Store the minimum required values in the URL fragment, not query parameters, so they are not sent in the normal HTTP request. Before copying, preview the values and warn that anyone with the link can see them and that the link may remain in browser history. Never include personal identifiers or send Scenario values to analytics.

**Consequences (testable):**
- Opening a copied link in a fresh session restores the same Journey and inputs from the URL fragment.
- The normal HTTP request, server access logs, and referrer do not receive the fragment; client history and anyone with the link can still expose it.
- Current baseline copies `window.location.href` but does not serialize changed inputs; the URL writer is unused and must be wired or replaced.
- Copying requires an explicit user action after the disclosure/preview; no share URL is generated or transmitted automatically.

#### FR-13: Measure Journey outcomes with data minimization

The system records Journey selection, calculation start/completion, and relevant feature engagement so comprehension and traction can be analyzed by Journey. Raw salary, savings, family, or university-preference inputs are not sent to analytics unless a separately approved consent and privacy design permits it.

**Consequences (testable):**
- Analytics distinguishes the four Journey funnels without requiring raw financial values.
- Users can use the calculator without creating an account. **[ASSUMPTION: no account]** Preserve the current stateless model for v1 unless privacy or shareability research points elsewhere.

## 5. Non-Goals (Explicit)

- Selecting a permanent lead segment before interviews and per-Journey analytics provide evidence.
- Discovering every German university/program from scratch or submitting applications.
- Guaranteeing admission, visa approval, employment, internship placement, safety, or social integration.
- Replacing qualified tax, legal, immigration, financial, or academic counseling.
- Claiming TruePackage is more accurate than LLMs without a controlled, current evaluation.
- Monetizing the first release; test paid advisor support only after traction is observed.
- Expanding beyond India↔Germany in this PRD.

## 6. MVP Scope

### 6.1 In Scope

- Four discoverable Journeys with journey-specific inputs, outputs, and analytics.
- Treat equal journey exposure as a learning experiment, not a commitment to scale all four equally. Compare comprehension and completion by Journey, then decide where to invest using the results and interviews.
- Before collecting comparison data, document recruitment/source, exposure period, per-Journey measures, baseline, sample sufficiency rule, and decision criteria. Extend the experiment rather than selecting a lead Journey from an inadequate sample.
- Work-offer and return-to-India financial decision flows.
- Student comparison of user-Shortlisted programs across the named dimensions, with transparent, adjustable scoring; the default-weight approval gate is in §7.1.
- Student funding estimate and job-seeker upfront investment/runway estimate.
- Source/date/coverage display, missing-data behavior, calculation assumptions, and an explicit share flow that reproduces inputs.
- Privacy-preserving journey analytics and responsive web access.

### 6.2 Out of Scope for MVP

- Program discovery/catalog search and application submission; compare options supplied by the student instead.
- Job placement or internship guarantees, visa application services, and personal safety guarantees.
- Accounts, persistent profiles, or paid advisor services unless a later evidence-based decision adds them.
- A universal lead segment or launch weighting based on unvalidated assumptions.

## 7. Cross-Cutting Quality, Data, and Platform Requirements

### 7.1 Data and Recommendation Guardrails

- Every ranked factor has a documented source, update cadence, geographic/program scope, and limitations in the addendum or implementation data registry.
- For score eligibility, “current” means: tax/legal rules match the effective year; fees/listings match the academic year; job/internship posts are no more than 30 days old; city-cost data was checked within 12 months; quality rankings are the latest subject-specific edition; safety data is the latest full reporting year and uses comparable definitions. Any other factor requires a documented source-specific validity window. **[ASSUMPTION: data freshness]** Proposed windows require data-owner approval before launch.
- The Default weighting method is published and validated with students and relevant subject-matter reviewers before release. Custom weights remain available.
- If data is missing, stale, or not comparable, the system shows that limitation and follows a validated incomplete-data rule; it does not silently substitute or impute a value.
- Safety and employment indicators are contextual evidence, not guarantees about individual outcomes.

### 7.2 Privacy and Security

- Minimize collection and retention of compensation, savings, family-support, and university-preference information.
- Do not include raw financial inputs or sensitive study preferences in analytics events.
- Shared Scenario data is included only through an explicit user action and a preview/warning that anyone with the link can view the values; no personal identifiers are included.
- The stateless, no-account model is an assumption to confirm before implementation.

### 7.3 Platform and Accessibility

- Responsive web; core calculator and comparison journeys work on mobile and desktop.
- Journey-selection, comparison, and scoring controls are keyboard-operable and provide screen-reader labels.
- Meet WCAG 2.2 Level AA for v1. Record applicable criteria checked, journey/viewports covered, browser/assistive-technology combinations, results, and exceptions. Unmet applicable AA criteria block release unless an exception is explicitly approved.
- Inputs have programmatic labels, instructions, required/optional state, and constraints. On submission errors, identify each problem in text and associate it with the field; move focus to a linked error summary or first invalid field; preserve valid inputs and clear corrected errors.
- All journey, form, comparison, scoring, disclosure, and share controls have logical keyboard order, visible focus that is not fully obscured, and no keyboard traps. Meet WCAG 2.2 AA target-size criterion 2.5.8 or its documented exception/spacing alternative.
- Material result changes are announced to assistive technology without moving focus. Weight controls expose name, value, range, and step; support keyboard adjustment; provide a non-drag numeric alternative; and announce the updated score/status and explanation.
- At 200% zoom and a 320 CSS-pixel viewport, core journeys remain usable without loss of content. Comparison data keeps program and factor headers programmatically associated with each value when reflowed or shown in an accessible alternative; any two-dimensional scrolling is confined to the comparison data.
- Charts have a text summary and an accessible table or equivalent containing categories, series, and units. Decision-relevant values are available without hover. Color and visual position are not the sole way to convey scores, ranks, or data status.
- With reduced motion enabled, remove/reduce nonessential animation and transitions while keeping all information and state changes available without motion; include this state in acceptance testing.
- Set a measurable performance budget before implementation stories are written.

## 8. Success Metrics

**Primary**
- **SM-1: Result comprehension.** In moderated tests, users correctly state their Journey's primary result, material assumptions, and next action. Establish a baseline before setting numeric targets. Validates FR-1 through FR-10.
- **SM-2: Journey completion.** Track started and completed flows separately for each Journey; compare cohorts before selecting a lead segment. Validates FR-1 and FR-3 through FR-10.
- **SM-3: Student comparison comprehension.** Students explain the factors, sources, Default weighting method, and how changing Custom weights affects the comparison. The pre-launch approval gate is defined in §7.1. Validates FR-6, FR-7, and FR-9.

**Secondary**
- **SM-4: LLM task comparison.** Using the same scenarios, compare TruePackage with an LLM across time to a usable result, missing inputs, assumption visibility, consistency when inputs change, and user comprehension. Do not frame the result as an accuracy claim unless calculations are independently verified. Validates FR-2 and FR-3 through FR-10.
- **SM-5: Evidence engagement.** Track whether users open source/assumption details by Journey, without capturing raw input values. Validates FR-2, FR-9, FR-11, and FR-13.
- **SM-6: Share reproducibility.** Shared Scenarios open with the same Journey and inputs. Validates FR-12.
- **SM-7: Qualified paid-help interest.** After a Journey demonstrates traction, measure voluntary requests for paid advisor help; do not make this a launch gate. Validates the later monetization hypothesis.

**Counter-metrics (do not optimize)**
- **SM-C1: False certainty.** Monitor whether users interpret estimates, source gaps, safety indicators, or the student score as guarantees. A lower completion rate is preferable to presenting a result with misleading certainty.
- **SM-C2: Data exposure.** No raw financial values appear in analytics payloads; shared Scenario values appear only after explicit preview/disclosure and never include personal identifiers.
- **SM-C3: Unsupported score coverage.** Do not optimize the number of programs ranked at the expense of source freshness and coverage disclosure.

## 9. Open Questions

1. What default factor weights are justified by student research and domain review? The source scan does not validate universal weights.
2. Can data owners approve the source-specific freshness and comparability rules in §7.1 before launch?
3. Which official and comparable data sources will cover safety across all shortlisted cities, beyond Berlin?
4. Which program-level graduate outcome sources are sufficiently comparable across institutions, and how should institution-reported figures be labeled?
5. Can a current, deduplicated job/internship feed be filtered for student eligibility, field, language, hours, and location?
6. How should community/friend support be represented: user-entered contacts, measurable campus community data, or both?
7. What is the correct source/update policy for city costs, program fees, rankings, student work rules, and visa funds?
8. Beyond fragment-based sharing and explicit disclosure, what browser-history or clear-link safeguards are needed for links containing Scenario values?
9. What numerical targets should follow baseline comprehension and per-Journey completion tests?
10. Which segments show enough traction to justify a lead focus or paid advisor experiment?
11. The returner and job-seeker Journeys remain product hypotheses without observed user stories; what interviews will validate their inputs and desired outcomes?
12. Do a few friends' offer-evaluation questions represent a recurring need, and which of the four Journeys can be recruited for user interviews?

## 10. Assumptions Index

- **[ASSUMPTION: pseudonym]** Asha and Sana are writing identifiers for an anonymized friend anecdote and the owner's retrospective student experience; they are not actual names.
- **[ASSUMPTION: unvalidated Journeys]** UJ-2 and UJ-4 are illustrative; validate the inputs and desired outcomes with returners and job seekers.
- **[ASSUMPTION: exact inputs and next action require user research.]** Applies to UJ-2 and UJ-4 until their actual flows are observed.
- **[ASSUMPTION: no account]** Preserve the current stateless/no-account model for v1 unless privacy or shareability research points elsewhere.
- **[ASSUMPTION: data freshness]** Proposed source-validity windows are suitable for score eligibility; data owners must approve them before launch.
