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


## Direct PDF downloads in Communication → Documents

- **Download PDF** creates a genuine, multi-page A4 PDF locally from the editable letter fields without a browser print dialog or new package dependency. It carries a conspicuous draft/review notice. It does **not** verify payment, log issuance or email anyone.
- **Download enrollment PDF** and **Download payment agreement PDF** (shown for the enrollment document type after choosing a student) call authenticated `POST /api/integrations/export`. Vercel verifies the signed-in Falowen administrator, passes only the student code/email and chosen document type to Student Docs, and returns the generated PDF bytes directly to the browser. Neither the file nor its data is copied to Firestore event logs. No email is sent and no `EnrollmentSent` flag is changed.
- Student Docs **must first be upgraded and redeployed** using the *full* Student Docs Apps Script (`Falowen_Student_Docs_Direct_PDF_Export.gs.txt` in the handoff), not by replacing the existing project with the short `docs/apps-script/registration-lifecycle-webhook.gs` reference. The export action is `exportEnrollmentDocumentFromSheet`, returning `mime_type`, `file_name` and `data_base64`. It reuses the existing `buildEnrollmentPdf_` and `buildAgreementPdf_` templates, image assets, and signature/retention blocks.
- Payment must be positive on the canonical `students` sheet, and the provided student code/email must match the row. Organisation-funded enrollments still use their separate workflow. Unpaid and mismatched records are rejected.
- The server and Apps Script cap PDF sizes to protect response limits. Do not log the private token or PDF payload, or use this endpoint for bulk exports. For larger files, use the Student Docs Drive/export workflow instead.

### Safe acceptance checks

1. Download a two-page general letter: it should be an A4 `.pdf` opened by a normal PDF reader, with a draft label and no print dialog.
2. After the Student Docs script is deployed, select a **paid** test student and download both official PDFs. Compare logo, content, dates, reference and signature with the existing Student Docs output. Verify that no emails or send-log entries were created.
3. Verify rejection for an unpaid student, an organisation-funded student, a code/email mismatch and an unauthorized admin login.
4. Confirm the pre-existing **Request official enrollment pack** button still uses its separate send/dedupe flow.


## Download a verified student certificate directly in Admin

In **Communication → Documents**, select **Certificate of completion**, choose the student and
their **German A1, A2 or B1** level, then click **Download certificate PDF**.

- The authenticated Admin API routes this export to the existing **Announcements + Certificates** Apps Script using its configured `ANNOUNCEMENT_WEBHOOK_URL` and private token. It does not route certificates through Student Docs.
- The Apps Script action `exportVerifiedCertificateFromScores` loads **fresh** canonical Students and Scores CSV data (not the four-minute mail cache), matches student code and email, and calls the **same** `findCompletionFromRows_`/required-assignment rules used by the automatic certificate sender. German A1 needs all 19 required passes including the verified final mock; A2/B1 use the existing 28-assignment and final-completion checks.
- On successful verification, the existing `generateCertificatePdf_` creates the **landscape A4 PDF** with the same school branding, completion date and Director's Drive signature. An unsigned certificate fails; a failing or incomplete learner is never exported. It is downloaded into the Admin browser; **no email is sent**, no `PROCESSED_CERTS` or issuance log is changed and the PDF bytes never enter Firestore audit logs.
- No Kiswahili certificate should be issued with the German certificate template. The UI limits certificate levels to German A1–B1 until a verified Kiswahili certificate generator exists.
- **Install and redeploy the full Announcements + Certificates Apps Script from the handoff file `Falowen_Announcements_Certificate_Direct_Export.gs.txt`**. It preserves the original 4,000-line system and introduces the read-only action after existing webhook token verification. Do **not** replace the real project with the short `docs/apps-script/certificate-direct-export.gs` reference module. GitHub/Vercel deployment alone does not update this separate Google Apps Script web app.

### Certificate acceptance tests

1. Select a learner who has passed all 19 A1 workbooks/final mock, download, and visually compare with the pre-existing signed certificate.
2. Attempt download for a learner missing the final mock, a failing workbook, or below 28 required A2/B1 passes: no PDF should be returned.
3. Try an invalid code/email pair and a non-admin login; both must be denied.
4. Verify the student receives **no email**, the certificate processed map is unchanged, and a second download works without altering issuance state.


## Teacher application acknowledgements and owner notifications

The public /teach route saves a new private application before the Admin API calls the existing Announcement webhook. It sends exactly two explicit-recipient general announcement rows (applicant acknowledgement and owner notification with the owner-only review link), with certificate, progress, review, class and date options disabled. It reuses the existing server-only ANNOUNCEMENT_WEBHOOK_URL/TOKEN and optional SHEET_NAME/GID settings (legacy VITE names only as migration fallback) and the existing Apps Script MailApp/Outbox runner. No separate trigger, mail provider or scheduled recovery is added. The fixed owner mailbox uses the existing owner identity; neither recipient can be supplied as a privileged field in the public form. Public duplicates return success without sending again. The existing public rate limit and honeypot apply; monitor existing MailApp quotas.

Stable batch/row event IDs derive from the saved application identity and creation time, so owner retries reuse the same keys. The webhook must confirm two accepted or deduplicated rows; otherwise the record stays pending/unconfirmed. The application still succeeds if email queueing fails. Admin can check the existing Outbox and use Retry email notifications on that application; no automatic retries or retrospective sends to older records. Verify the deployed Announcement script accepts explicit email recipients outside the student roster, handles both rows and deduplicates row event IDs before enabling retries in production. Queue acceptance is not delivery confirmation. Use a controlled test applicant and check both recipients and the existing Email Delivery Log; repeat the public submission and confirm no extra rows. Do not replace the full Announcement Apps Script with the abbreviated reference adapter.
