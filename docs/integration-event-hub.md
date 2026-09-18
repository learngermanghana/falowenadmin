# Falowen Integration Event Hub

Falowen Admin now routes score-sheet and communication webhook traffic through one same-origin gateway.

## Browser flow

- Score saves call `dispatchIntegrationEvent({ type: "score.upsert" })`.
- Announcements/certificates call `dispatchIntegrationEvent({ type: "communication.send" })` or `certificate.send`.
- The browser sends only the Firebase ID token and business payload to `/api/integrations/dispatch`.
- Apps Script URLs and tokens are never included in the Vite bundle.
- Each request receives an `event_id` and is recorded in Firestore `auditLogs` with `integrationEvent: true`.
- Communication → System events shows health, recent events and retry controls.

## Server configuration

Configure these as Vercel server environment variables. The gateway still accepts the legacy `VITE_*` names as a migration fallback, but new secrets should use server-only names.

```
SCORES_WEBHOOK_URL
SCORES_WEBHOOK_TOKEN
SCORES_WEBHOOK_SHEET_NAME
SCORES_WEBHOOK_SHEET_GID

ANNOUNCEMENT_WEBHOOK_URL
ANNOUNCEMENT_WEBHOOK_TOKEN
ANNOUNCEMENT_WEBHOOK_SHEET_NAME
ANNOUNCEMENT_WEBHOOK_SHEET_GID

FALOWEN_ADMIN_EMAILS
```

`FALOWEN_ADMIN_EMAILS` is a comma-separated allowlist.

## Apps Script compatibility

The score worker receives `action: "upsertScoreRows"`, `mode: "upsert"`, canonical `assignment_id`, `dedupe_id`, and an `event_id`. The current upsert Apps Script can add the new event column automatically.

The communication worker receives the existing announcement row schema plus an `event_id`. Unknown fields are safe for the current Apps Script and can be stored later if desired.

## Reconciliation

Existing timed Apps Script jobs can remain enabled while the hub is introduced. They act as recovery/reconciliation rather than the primary browser-to-Sheets communication path.

## Security

Do not put score or announcement webhook tokens in `VITE_*` variables after the migration is complete. Rotate any token that has previously been exposed in source, chat, logs or a built frontend.
