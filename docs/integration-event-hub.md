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

REGISTRATION_DOCS_WEBHOOK_URL  # optional override; default is the deployed Registration Docs web app
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
    "webhook_url": "https://script.google.com/macros/s/AKfycbxWsVmzNdDMXtUd0CwChFXR_Iy6lbb7oVVt8ao_6_8oYYFI9Te9Y7pD0FgIJTjAozYOQg/exec"
  }
}
```

Falowen now defaults to the deployed Registration Docs web app at `https://script.google.com/macros/s/AKfycbxWsVmzNdDMXtUd0CwChFXR_Iy6lbb7oVVt8ao_6_8oYYFI9Te9Y7pD0FgIJTjAozYOQg/exec` in both Firebase and the Vercel Integration Hub. `REGISTRATION_DOCS_WEBHOOK_URL` remains available only as an override if the Apps Script is redeployed under a different URL. `REGISTRATION_DOCS_WEBHOOK_TOKEN` is optional; when absent, the existing `ANNOUNCEMENT_WEBHOOK_TOKEN` is used.

## Communication page → the two Apps Script projects (November 2026)

The four Communication tabs use distinct verified workflows:

1. **Bulk / One student / Class promotions** submit message rows through the authenticated Admin integration hub. Multi-class sends use one webhook batch with a stable `event_id:row_N` key per row. The Announcements Apps Script appends to the **Announcements** sheet, builds the branded email using `subject`, `email_type`, and `show_*` options, and sends/queues through its existing MailApp/Outbox pipeline. The certificate watcher, A1 completion checks, teacher BCC rules and five-minute recovery cycle remain owned by that same full Apps Script.
2. **Documents → Enrollment letter draft** offers a separate **Request official enrollment pack** action after the administrator selects a student. The browser sends **only** student code/email. The Registration Docs Apps Script looks up the authoritative **students** tab, requires `Paid > 0`, blocks organisation-funded packs, and relies on existing `EnrollmentSent` and enrollment/agreement log references to prevent duplicates. It generates its official PDFs rather than sending the editable browser letter.

The Apps Script projects are not stored or deployed by Vercel/GitHub. When applying the migration, **update the two existing bound projects separately**, preserving their complete business logic; do not replace the full certificate or Student Docs automation with the short webhook reference files in `docs/apps-script/`. Redeploy each project as a Web App, then check the gateway's `ANNOUNCEMENT_WEBHOOK_URL` / `REGISTRATION_DOCS_WEBHOOK_URL` point to the current versions. Both projects use their own Script Properties value of `ANNOUNCEMENT_WEBHOOK_TOKEN`, matched to the server-side secret. Do not put tokens in browser variables.

### No-send verification

- Run `setupAnnouncementSystem()` in the Announcements project to add the `event_id` column without clearing existing rows; confirm the existing certificate functions and recovery triggers are still present.
- With a safe test inbox/student, send **one** personal message and check one `Announcements` row with `event_id`, `subject`, `email_type`, and the correct email. Retry the same `event_id` at the webhook level and verify the response reports `duplicate: true`, with no new row.
- Preview a class announcement using an approved test audience before any real bulk send. `count` means **rows accepted**, not proof of mailbox delivery; inspect **Email Delivery Log** and **Outbox** for per-recipient status.
- Select an unpaid test student and request an official enrollment pack: the request must fail with the payment gate. Use a previously issued, paid test record to verify `ALREADY_SENT` without a second pack.
- Verify an organisation-funded test record returns `ORGANISATION_MANAGED`; do not convert an editable sheet `Paid` cell into an independently verified receipt.
- Confirm the health panel shows both integration endpoints configured. A 200 response from the gateway or a merged PR alone does **not** verify a deployed Apps Script or delivered email.

This change does not add timers or polls, and it keeps receipts under the verified Admin payment ledger instead of the Student Docs sheet.
