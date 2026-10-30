# PRD Quality Review — TruePackage Decision Workflows

## Overall verdict
The PRD is an adequate staged handoff: it is candid about evidence limits and has explicit gates for the learning experiment, student scoring, freshness, sharing, and accessibility. Before UX and implementation use it as canonical, resolve three medium risks: the mismatch with labels in the shipped selector, the scope of FR-9's user-entered evidence exception, and the changed success-priority relative to the Product Brief.

## Decision-readiness — adequate
The PRD makes the major product choices explicit: no lead Journey is selected before sufficient evidence (§0; §5), four routes receive comparable exposure as a learning experiment (§4.1 FR-1; §6.1), and the overall student score is withheld when its evidence gate fails (§4.4 FR-9). The experiment cannot collect comparison data until its recruitment/source, exposure period, measures, baseline, sample-sufficiency rule, and decision criteria are documented (§6.1). Student weights and source-freshness windows remain approval gates, while sharing safeguards are still an open question (§7.1; §9 questions 1–2, 8). These are visible staged decisions, not hidden claims of readiness.

### Findings
- None.

## Substance over theater — strong
The Vision is specific to India↔Germany decisions and rejects unsupported novelty and accuracy claims (§1). Four distinct Jobs To Be Done and named journeys map to capabilities (§2.1–§2.3; §4). The addendum identifies the student account as retrospective evidence, the returner and job-seeker journeys as unvalidated, and sources as candidates rather than a settled integration plan (“Student Comparison Source Candidates”; “User Evidence and Boundaries”). The breadth of student comparison is approved in the updated brief but remains framed as a hypothesis about preferences, not proven demand.

### Findings
- None.

## Strategic coherence — adequate
The capabilities serve a coherent thesis of guided, inspectable workflows rather than unsupported calculation superiority (§1; §5). The experiment protocol is unusually explicit for a PRD: §6.1 names the required protocol elements and says to extend an inadequate experiment rather than select a lead Journey. Metrics cover comprehension, Journey completion, student comparison comprehension, and counter-metrics (§8). However, the PRD classifies completion as a primary success metric at the same level as comprehension, while the Product Brief says trust/comprehension comes first and per-Journey traction follows (“Success Criteria”). Trust also has no distinct success measure in §8.

### Findings
- **medium** Success priorities drift from the approved brief (§8; Product Brief, “Success Criteria”) — The brief sequences trust/comprehension first and traction second; the PRD puts Journey completion among primary metrics alongside comprehension and does not define a distinct trust measure. *Fix:* Preserve the sequence by classifying completion as a later traction measure and define how trust is assessed, or explicitly revise the brief and explain the changed priority.

## Done-ness clarity — adequate
Many FRs have observable consequences: FR-6 specifies outcome-data metadata and prohibits incomparable outcome comparisons; FR-11 gates release on date meaning and source revalidation; FR-12 specifies explicit sharing, fresh-session restoration, and exposure disclosure (§4.4 FR-6; §4.6 FR-11–FR-12). The accessibility section gives concrete verification and release criteria, while a measurable performance budget is required before implementation stories (§7.3). FR-9 has a strong fail-closed intent, but its acceptance boundary for user-entered evidence needs clarification.

### Findings
- **medium** FR-9 does not bound when user-entered values satisfy the evidence gate (§4.4 FR-6–FR-9; Addendum, “Ranking Method Guardrails”) — The overall score requires current, comparable evidence for each option and non-zero-weighted factor, but “supported by a source or user-entered value” does not say whether user input can stand in for factual factors such as graduate outcomes or safety. *Fix:* Define which factors may use user-entered evidence, require appropriate provenance for factual claims, and specify how such inputs are labeled and judged current/comparable; otherwise keep the overall score withheld.

## Scope honesty — strong
Non-users, non-goals, MVP inclusions, and exclusions are explicit (§2.2; §5; §6). UJ-2 and UJ-4 are marked unvalidated; UJ-1 and UJ-3 disclose their anecdotal basis (§2.3; Addendum, “User Evidence and Boundaries”). Source coverage, default weights, freshness approvals, and unresolved share safeguards are visible in §7.1 and §9. The Assumptions Index is complete and roundtrips with inline tags (§2.3; §4.6 FR-13; §7.1; §10).

### Findings
- None.

## Downstream usability — adequate
The PRD has a glossary, named protagonists, stable FR/UJ/SM identifiers, and resolving references (§2.3; §3; §4; §8). Its canonical labels are consistent internally and match the Product Brief Journey table (§3; §4.1 FR-1; Product Brief, “Journeys and Outcomes”). They do not yet match the current product selector: `src/App.tsx` labels the routes “India → Germany,” “Germany → India,” “Job Hunt Visa,” and “Student.” FR-1 explicitly calls for the canonical labels and specifically renames only “Job Hunt Visa,” leaving the intended treatment of the other existing labels unclear.

### Findings
- **medium** Canonical Journey labels are not reconciled with the shipped selector (§3; §4.1 FR-1; current selector in `src/App.tsx`) — Current UI labels differ from the PRD/brief labels “Work Move,” “Return to India,” “Study in Germany,” and “Job Search”; only the Job Hunt Visa rename is explicit in FR-1. *Fix:* State whether all four existing labels are replaced or retained as explanatory descriptors, and require one consistent user-facing label set across the entry point and Journey routes.

## Shape fit — strong
Named-protagonist journeys suit a public consumer product with consequential, multi-step choices (§2.3; §4). The PRD is appropriately chain-top: it defines user-visible behavior, evidence, privacy, and accessibility requirements without prescribing architecture (§0; §7–§8). Student comparison has greater rigor because it carries evidence and scoring risk; the addendum keeps source-method detail and unresolved options out of the core requirements.

### Findings
- None.

## Mechanical notes
- **Journey labels:** PRD and Product Brief table use the same four canonical labels. The current app selector still uses “India → Germany,” “Germany → India,” “Job Hunt Visa,” and “Student” (`src/App.tsx`, navigation selector); see the medium finding under Downstream usability.
- **ID continuity and references:** FR-1–FR-13, UJ-1–UJ-4, SM-1–SM-7, and SM-C1–SM-C3 are unique and contiguous. Reviewed cross-references resolve.
- **Assumptions Index roundtrip:** All five inline assumption tags are represented in §10, and each §10 entry appears inline: pseudonym, unvalidated Journeys, exact inputs/next action requiring research, no account, and data freshness.
- **UJ protagonists:** Asha, Neha, Sana, and Kabir are named with context inline (§2.3).
- **Required sections:** Vision, users/non-users, journeys, glossary, FRs, non-goals, MVP scope, cross-cutting requirements, success/counter-metrics, open questions, and Assumptions Index are present. The addendum covers candidate sources, evidence limits, and current baseline gaps.
- **Strategic experiment:** §6.1 requires recruitment/source, exposure period, per-Journey measures, baseline, sample-sufficiency rule, and decision criteria before comparison data collection; an inadequate sample extends the experiment rather than determining a lead Journey.
- **FR-9 evidence gate:** It requires evidence for every non-zero-weighted factor and every option, allows an overall score only when evidence is current and comparable, and otherwise withholds the score and explains gaps (§4.4 FR-9). The user-entered evidence exception needs the boundary identified above.
- **Fragment share policy:** FR-12 specifies minimum Scenario values in the URL fragment, preview and warning, explicit action, fresh-session restoration, no identifiers, and no analytics values (§4.6 FR-12; §7.2; Addendum, “Approved Share-Link Policy”). It correctly states that fragments avoid normal HTTP request/referrer exposure but remain visible through browser history, clipboard, and recipients; clear-link/retention safeguards remain open (§9 question 8; Addendum, “Approved Share-Link Policy”).
- **Data-date gate:** FR-11 requires documenting what dates mean, revalidating sources before release, and reconciling the June 2026 footer with March 2026 source-register/details dates; §7.1 requires source-specific windows and data-owner approval before launch (§4.6 FR-11; §7.1; §9 question 2; Addendum, “Current Product Baseline Gaps”).
- **Brief alignment:** Student outcomes are explicitly named in FR-6 and the current brief; shortlisted-program scope and default-weight validation are aligned (§4.4 FR-6–FR-9; Product Brief, “Journeys and Outcomes”; Product Brief Reconciliation, “Findings”). The remaining substantive alignment issue is the success-priority sequence noted above.