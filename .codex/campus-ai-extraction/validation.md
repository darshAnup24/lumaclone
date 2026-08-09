# Phase 12 AI extraction validation

## Result

PASS on attempt 3.

- Groq model `openai/gpt-oss-120b` is available and active for the configured account.
- Groq chat completions use strict JSON Schema; OpenAI Responses remains an optional provider adapter.
- All required extraction fields, content types, categories, timestamps, timezone, URLs, capacity, confidence, and ambiguity metadata are schema-validated.
- Unsupported categories normalize to `other`; case, plural, spaces, slashes, and common career labels normalize correctly.
- User override: verified relevant records publish when confidence is missing or meets threshold. Present low confidence, ambiguity, and unverified senders go to review; irrelevant content is rejected.
- Extraction result/confidence and source linkage are persisted; failures update inbound status/error without crashing the webhook.

Validation: ordinary suite PASS (20 files: 19 passed, 1 opt-in live skipped; 102 tests passed); live Groq strict extraction PASS; typecheck, lint, build, diff, and names-only template checks PASS.

Attempt 2 failure and repair: live output returned `Hackathon`; normalization originally treated case as unsupported and mapped it to `other`. Canonical category normalization was added and the identical live validation then passed.
