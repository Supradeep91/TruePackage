# AI platform distribution digest, round 1

**Accessed:** 2026-10-30

## First-party platform evidence

- **[claim, source, publisher, pub_date, accessed, confidence, class]** Anthropic says Claude users can browse a directory of connected apps/tools and click Connect; remote app/service connectors are available to paid plans. Examples include using Linear context to generate release notes and Notion/Canva/Stripe integrations. This establishes a distribution/invocation surface, not adoption or conversion for a specific connector. **Source:** https://claude.com/blog/connectors-directory; **publisher:** Anthropic; **pub_date:** 2025-07-14; **accessed:** 2026-10-30; **confidence:** high for documented directory behavior; **class:** platform capability.
- **[claim, source, publisher, pub_date, accessed, confidence, class]** OpenAI's current developer docs describe discoverable plugins for ChatGPT and Codex that can combine repeatable workflow instructions (Skills), an MCP server with structured tools/results, and optional in-chat UI. The docs recommend adding UI where users need to inspect, compare, edit, confirm, or navigate structured information, and say tools should remain useful without the component. **Source:** https://developers.openai.com/plugins/concepts/plugins.md and https://developers.openai.com/plugins/build/app-quickstart.md; **publisher:** OpenAI; **pub_date:** no page date shown; **accessed:** 2026-10-30; **confidence:** high for current documented platform model; **class:** platform capability.
- **[claim, source, publisher, pub_date, accessed, confidence, class]** OpenAI's plugin security docs call for least privilege, explicit consent, minimal structured data, retention policies, PII-redacted logs, server-side input validation, and human confirmation for irreversible writes. UI components run in isolated iframes with restricted APIs/network access. **Source:** https://developers.openai.com/plugins/guides/security-privacy.md; **publisher:** OpenAI; **pub_date:** no page date shown; **accessed:** 2026-10-30; **confidence:** high for documented requirements; **class:** platform security/privacy guidance.

## Product hypothesis

A small **TruePackage decision tool for ChatGPT/Claude** could expose deterministic calculations as structured MCP tools, then optionally render a comparison UI for offers or shortlisted programs. The model gathers missing user inputs and explains results; the existing calculation engine (or a validated server-side equivalent) owns numeric outcomes. This meets the user in the LLM context instead of assuming they will leave it. The distribution pattern is documented; demand, directory discovery, app-review eligibility, and conversion are not verified.

## Limits

The linked 2026 TurboTax-on-Claude/ChatGPT page redirected to an advertising/cookie-sync endpoint through the current fetch tool and could not be verified. No claim is made about TurboTax's integration features or performance. Platform docs do not prove discoverability, listing approval, traffic, or paid conversion for a new app.
