# Falowen tuition payment receipt PDFs

The verified payment announcement source now supports a short payment-confirmation email with an **attached branded PDF receipt** instead of a text-only receipt.

## Deployment order (two independent runtimes)

1. Deploy the updated `sendStudentPaymentUpdateEmail` Firebase trigger from `functions/studentPaymentUpdateEmails.js` using the usual verified production workflow. While the older Apps Script is still installed, it can continue sending the existing legacy text notice with the additional JSON fields ignored.
2. Replace the **entire** bound Announcements Apps Script source with the provided full handoff file `Falowen_Announcements_PDF_Receipts_20261122.gs`. It preserves certificate/transcript generation, the existing webhook token, and the existing outbox; do not paste only a partial helper.
3. Save and **redeploy a new web-app version** of the Apps Script. A GitHub or Vercel deployment alone does not redeploy Apps Script. Older queued student payment updates without structured JSON remain legacy notices during the cutover; newly structured verified events get PDF attachments. Malformed nonempty payloads never silently downgrade.
4. Verify with **test-mode or otherwise non-charging** payment events: first and second student instalments, a fully-paid student, and an organisation receipt. Inspect the PDF attachment and make sure the email does not create another student credit.

## Financial invariants

- Only the already existing verified finance webhook sends these receipt types. Manually edited Announcements rows do not become official payment receipts.
- `payment_update` has a versioned `receipt_payload_json` with **the latest transaction amount**, total tuition credited, optional remaining balance, payment reference, student identity and provider; the PDF amount must be **the latest transaction amount**, not the cumulative total.
- `organisation_payment_receipt` continues to receive the versioned, server-verified organisation allocation payload. The PDF shows the transaction amount, allocation breakdown, fees and outstanding amount only where confirmed.
- If a **nonempty** financial payload is invalid or PDF conversion fails, the Apps Script must not silently fall back to a text-only financial receipt. Empty historical student payment payloads can retain legacy notice behavior during the deployment transition.
- The existing MailApp/Outbox attachment storage and recipient/event dedupe continue to apply. No new scheduled trigger, paid PDF API, or external document service is needed.
- Historical receipt emails and completed transaction records remain unchanged. **Do not auto-resend them solely because this template changed.**

## Smoke tests

- Student: initial verified tuition credit GHS 2,000, remaining GHS 1,000 -> PDF shows GHS 2,000 received, GHS 2,000 total paid, GHS 1,000 due.
- Student: later verified credit GHS 1,000 -> separate PDF shows GHS 1,000 received, GHS 3,000 total paid, GHS 0 due (if supported by the ledger).
- A balance-only edit, an unverified or replayed Paystack reference, or an impossible total should produce **no new receipt**.
- Organisation: partial manual payment must reconcile with the sum of student allocations and must show remaining tuition separately. A Paystack organisation checkout keeps processing charges separate from tuition credits.
