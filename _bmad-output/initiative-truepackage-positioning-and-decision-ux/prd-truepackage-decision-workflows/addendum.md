# PRD Addendum: Data Provenance and Open Method Questions

## Student Comparison Source Candidates

The following sources were inspected on 2026-10-30 for PRD scoping. They are candidate evidence sources, not a finalized integration plan.

| Dimension | Candidate source | Evidence and limitations |
| --- | --- | --- |
| Program availability | [DAAD / Hochschulkompass](https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/) | Searchable German degree-program listings; HRK says institutions enter/update their own listings. Availability is not a quality judgment. |
| Program quality and fit | [CHE University Ranking](https://www.che.de/en/ranking-germany/) | Subject-specific, multi-dimensional indicators and student/professor views; selected subjects only, with subject data refreshed on a multi-year cycle. Not a complete or universally current quality score. |
| Graduate outcomes | No common program-level source was verified in this scan. | Before using employment or further-study outcomes in scoring, identify a comparable source and define cohort, denominator, reporting period, and institution-reported status. Otherwise mark the factor unavailable; do not infer or rank. |
| Program fees and study finance | [DAAD finance guidance](https://www.daad.de/en/studying-in-germany/living-in-germany/finances/) | Fees vary by state, institution, and program. The cited average student living expense uses a 2023 survey; the page's visa-funds figure is explicitly dated 2025 and must not be presented as a current 2026 requirement without verification. |
| City accommodation and living cost | [DAAD renting guidance](https://www.daad.de/en/studying-in-germany/living-in-germany/renting/) | Provides examples by city, but the inspected estimates have no clear vintage. Use only with a visible date and refresh policy; cost varies by individual housing choice. |
| Student work and internships | [Federal Employment Agency job search](https://www.arbeitsagentur.de/jobsuche/) and [student internships/holiday jobs](https://www.arbeitsagentur.de/en/working-in-germany/internships-holiday-jobs-for-students) | Live vacancies and eligibility guidance exist. Feeds can mix role types and do not establish an individual student's probability of finding work or an internship. |
| Safety | [Berlin Police crime statistics](https://www.berlin.de/polizei/verschiedenes/polizeiliche-kriminalstatistik/) | Official registered-crime data is available, but unreported incidents and jurisdiction-specific definitions limit comparisons. It is not a personal, campus, or commute-safety guarantee. Equivalent city coverage must be verified before cross-city scoring. |
| Community and friends | [DAAD/DZHW Wissenschaft weltoffen](https://www.wissenschaft-weltoffen.de/en/) and [DAAD student community](https://www.study-in-germany.com/en/community/) | Aggregate international-mobility data and student stories can provide context, but neither measures whether a particular student will have friends or social support nearby. Treat known contacts as user-provided context, not a sourced score. |

## Ranking Method Guardrails

The user wants a published default method plus adjustable weights. The source scan did not establish valid universal weights across course fit, cost, outcomes, part-time work, internships, safety, and community. Before launch, the default methodology needs user research and domain review. The product should expose factor-level evidence, source/date, coverage, weights, and limitations; missing or stale data must be visible and should not silently improve or penalize a program. The PRD's conservative scoring rule is: calculate an overall score only when every non-zero-weighted factor has current, comparable evidence for every option; otherwise show factor-level evidence and withhold the score. The source-specific validity windows in PRD §7.1 are proposed and require data-owner approval before launch. The exact default weighting method remains open.

## User Evidence and Boundaries

- Work-offer trigger: friends in India received German offers and asked whether they were good. The owner knew the offered salary, German city, and Indian salary; the decision was whether leaving was worthwhile and what to negotiate. The owner answered from experience, not a standardized calculation. This is one anecdote, not representative research.
- Student retrospective: the owner compared university options using DAAD and conversations with seniors. Course/program fit was the primary factor; cost, work/internship opportunities, safety, reputation/outcomes, and community/friends also mattered. No named university, score, or outcome was supplied.
- Student scope for this PRD: compare options the student has already shortlisted. Program discovery from scratch and admissions/application guidance are out of scope.
- Return-to-India and job-seeker journeys are owner-defined product goals but lack observed user stories. Treat their narrative details as hypotheses and validate them.

## Current Product Baseline Gaps

Verified in the current repository on 2026-10-30:

- The share button copies the current browser URL, but the app does not call the URL state's write function after input changes. The copied URL therefore does not reliably reproduce the current Scenario. See [App.tsx](../../../src/App.tsx) and [useURLState.ts](../../../src/hooks/useURLState.ts).
- The public footer says “Data: June 2026,” while the source register metadata says “Last updated: March 2026.” The in-app source details also say March 2026. Define whether these dates refer to different datasets or update the stale label. See [data-sources.md](../../../docs/data-sources.md).
- The work-offer hero claims a 52–57% take-home range while the displayed example says 49%; the decision copy can pair “Good offer — counter” with “Accept. Counter …”. The PRD requires scenario-consistent figures and an unambiguous action. See [App.tsx](../../../src/App.tsx).

## Approved Share-Link Policy

The owner approved an explicit-share model that stores the minimum inputs needed to reproduce a Scenario in the URL fragment rather than query parameters. The user previews the included values and is warned that anyone with the link can read them and that the link may remain in browser history. No personal identifiers or Scenario values go to analytics. Fragments are not sent in normal HTTP requests, but they are not secret; browser history, clipboard contents, and recipients remain exposure surfaces. The PRD leaves clear-link/retention safeguards as an implementation question.
