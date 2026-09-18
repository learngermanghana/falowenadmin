# Falowen Integration Event Hub

Falowen Admin now routes score-sheet, communication and registration-document webhook traffic through one event hub, while Firebase lifecycle triggers write automatic registration events into the same System Events audit stream.

## Browser flow

- Score saves call `dispatchIntegrationEvent({ type: "score.upsert" })`.
- Announcements/certificates call `dispatchIntegrationEvent({ type: "communication.send" })` or `certificate.send`.
- Student creation records `registration.received`; the first recorded payment emits `enrollment.confirmed`.
- `enrollment.confirmed` asks the Registration Docs Apps Script to generate the enrollment letter, payment agreement and first receipt.
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

REGISTRATION_DOCS_WEBHOOK_URL
# REGISTRATION_DOCS_WEBHOOK_TOKEN is optional; when omitted the existing
# ANNOUNCEMENT_WEBHOOK_TOKEN is reused.

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


## Registration lifecycle

The registration-document worker is deliberately separate from the Announcement/Certificate worker.

- `registration.received` initializes/records the student's registration lifecycle without issuing official enrollment documents.
- `enrollment.confirmed` is emitted once when the student moves from no recorded payment to the first recorded payment.
- The Registration Docs Apps Script keeps its existing spreadsheet on-edit and five-minute scans enabled as reconciliation fallbacks.
- Duplicate protection remains authoritative in the Apps Script through `EnrollmentSent`, stable enrollment/agreement references and the send log.
- Automatic Firebase events are written to `auditLogs` with `integrationEvent: true`, so Communication → System events can show failures and retry them.
- The registration worker reuses the existing Announcement webhook token. Only the separate Registration Docs web-app URL must be configured.


### Firebase runtime configuration

The automatic Firestore lifecycle trigger needs only the Registration Docs web-app URL. It reuses the existing Announcement token from the communication configuration.

```json
{
  "communication": {
    "announcement_webhook_token": "<existing shared token>"
  },
  "registration_docs": {
    "webhook_url": "https://script.google.com/macros/s/<deployment-id>/exec"
  }
}
```

The same Registration Docs URL should also be configured in Vercel as `REGISTRATION_DOCS_WEBHOOK_URL` so failed automatic events can be retried from Communication → System events. `REGISTRATION_DOCS_WEBHOOK_TOKEN` is optional; when absent, the existing `ANNOUNCEMENT_WEBHOOK_TOKEN` is used.
