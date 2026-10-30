# Zero-Cash Validation Plan

## Decision

Find out whether people in any of TruePackage's four Journeys have a recent, unresolved decision problem that the current calculator does not help them finish. Do not select a lead Journey in advance.

## Constraints

- Cash budget: $0. No paid API calls, ads, MCP/assistant integration, new software, or product changes.
- Use the existing live calculator and free, personal, or community-based recruiting.
- Do not collect names, contact details, salary values, offer letters, or other identifying financial inputs. Participants may use hypothetical values or operate the site themselves.
- Record only anonymous session counts and broad blocker categories. Ask permission before taking notes; do not capture screenshots or scenario URLs.
- Treat this as directional discovery, not proof of traction or statistical validation.

## Hypothesis and Disconfirming Check

**Hypothesis:** For at least one Journey, people recently faced a cross-border decision, tried to solve it with a calculator, spreadsheet, search, or advice, and still lacked a clear next step. A guided conversation may help them complete the existing decision workflow.

**Disconfirming check:** Run eight 15-minute walkthroughs, two each with India-to-Germany movers, Germany-to-India returners, students, and job seekers. If participants cannot describe recent behavior, complete the relevant task without meaningful friction, or see no additional value in guided input after trying the current calculator, do not build the AI feature.

## Recruiting

Invite two people per Journey through existing personal or professional networks and relevant communities where recruitment is allowed. Use a short, neutral invitation:

> I'm testing whether a free India/Germany decision calculator helps people compare a real move, study, or job-search decision. Could you spend 15 minutes trying it and telling me where it does or doesn't help? No documents or personal figures needed.

Do not pitch the AI idea in the invitation. If eight participants are not available, run fewer sessions and label the result incomplete; do not replace missing evidence with assumptions.

## Session Script

1. **Consent and privacy:** Explain that this is a product test, not financial advice. Ask the participant to use hypothetical values or keep private inputs off the record. Confirm that only anonymous observations will be noted.
2. **Recent behavior:** “Tell me about the last time you had to make this kind of decision.” “What did you do next?” “What tools or people did you use?” “What was still unclear?” Ask about what happened, not what they might do someday.
3. **Current-task walkthrough:** Ask them to try the existing calculator for a relevant hypothetical scenario. Do not teach the interface. Observe whether they finish, where they pause, what they ask, and whether they seek an external answer.
4. **Neutral concept check:** Only after the walkthrough, describe a guided version in one sentence: “You explain your situation, review the extracted inputs, and the existing calculator returns the numbers with assumptions and sources.” Ask what, if anything, this would improve or make worse.
5. **Behavioral follow-up:** Ask whether they would be willing to return for a second test after a prototype exists, or introduce one person who recently faced the same decision. Record the commitment only as yes/no; do not treat verbal enthusiasm as traction.

Avoid asking for hypothetical willingness to pay. Monetization is not the current decision.

## Session Scorecard

Use one row per session and no participant identifiers.

| Session | Journey | Recent real decision described? | Existing workaround | Finished calculator task unaided? | Unprompted blocker | Guided concept addresses blocker? | Volunteered follow-up/referral? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | India to Germany |  |  |  |  |  |  |
| 2 | India to Germany |  |  |  |  |  |  |
| 3 | Germany to India |  |  |  |  |  |  |
| 4 | Germany to India |  |  |  |  |  |  |
| 5 | Student |  |  |  |  |  |  |
| 6 | Student |  |  |  |  |  |  |
| 7 | Job seeker |  |  |  |  |  |  |
| 8 | Job seeker |  |  |  |  |  |  |

## Decision Rules

- **Continue discovery in a Journey:** Both participants describe recent behavior around the same unresolved job, and at least one demonstrates a current workaround or gets stuck in the existing task. This is a signal to recruit more people in that Journey, not proof of demand.
- **Consider a no-code guided-flow mock:** A Journey shows repeated task friction and participants can identify a specific improvement over the existing calculator. Re-test the mock before any paid API or integration work.
- **Stop or reframe the AI idea:** Most participants finish the task without help, cannot recall a recent problem, or prefer the existing form and see no clear benefit from conversational input.
- **Call it traction only after real usage behavior:** Look for organic completion, return use, or sharing in the existing product. Interviews and stated interest alone do not qualify. Check that existing analytics can measure those events without recording scenario values; if not, use manually observed sessions until instrumentation is justified.

## Immediate Next Actions

1. Recruit the first eight participants without paid promotion.
2. Run the same script and scorecard for all four Journeys.
3. Review the anonymous patterns before choosing a lead Journey or building anything.

**Cost boundary:** No cash spend is required. The cost is founder time; if that time is unavailable, pause rather than substitute an unmeasured AI build.