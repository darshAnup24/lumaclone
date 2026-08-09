# Phase 11 — Resend Inbound Email

## Objective
Receive club/institutional emails through a dedicated inbound address and webhook.

## Flow
Email -> Resend -> webhook -> store raw email -> process.

## inbound_emails fields
id, message_id, from_email, from_name, to_email, subject, text_body, html_body, received_at, processing_status, extraction_result, error_message, created_at.

Statuses:
received, processing, extracted, needs_review, published, rejected, failed.

## Security
- Validate inbound webhook authenticity according to the chosen Resend integration.
- Do not trust arbitrary sender names.
- Unknown senders go to review.
- Preserve raw email for audit/debugging.
- Do not expose API secrets.

## Acceptance criteria
- Webhook receives and persists inbound messages.
- Raw content is retained.
- Processing failures are recorded without crashing the application.
- Verified organization matching is possible.
