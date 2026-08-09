# Phase 11 inbound email validation

## Result

PASS on attempt 2.

- `email.received` accepts only fresh, valid Resend/Svix signatures over the untouched body.
- Full received content is fetched server-side and raw text, HTML, attachments, envelope metadata, sender, subject, and timestamps are retained.
- Sender display names are never used for trust. Exact normalized addresses match only verified official organization patterns; unknown senders enter `needs_review`.
- Content retrieval failures persist `failed` plus `error_message`; message-ID upsert makes webhook retries idempotent.
- Secrets are server-only and `.env.example` is names-only.

Validation: 92 tests, typecheck, lint, production build, and diff/template checks pass. A signed runtime probe returned HTTP 200, persisted a unique synthetic message as `failed` with an error, verified raw-content columns, and deleted the exact synthetic row afterward (`synthetic_rows_removed=1`). No user email data was printed.

Configuration evidence: webhook signing secret is present and the cloud database link/migrations are active.
