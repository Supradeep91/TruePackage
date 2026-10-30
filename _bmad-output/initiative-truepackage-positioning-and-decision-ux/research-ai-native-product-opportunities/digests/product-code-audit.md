# Product code audit (internal context, not market evidence)

**Inspected:** 2026-10-30

- `src/App.tsx` defines `GEMINI_URL`, `callGemini`, and `runAI`, but workspace search finds no call site for `runAI` or `callGemini` outside their definitions. The current checked-in frontend therefore does not appear to invoke the Gemini flow. The audit did not inspect deployment telemetry or server-side request logs.
- Product context is four journeys: India→Germany work, Germany→India return, Student, and Job Search. The recommendation should fit those flows rather than introduce a generic chatbot.

This observation helps scope the implementation opportunity but is not evidence that users want AI, nor does it establish what the deployed site does at runtime.
