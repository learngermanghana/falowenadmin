# Organisation enrolment

Public route: `https://www.falowen.app/organisation-enrolment`. No organisation login or CSV upload. The organisation enters contact details once, types student rows or pastes tab-separated cells, and submits up to 50 students. Blank rows are ignored; name, student email, phone and level are required. No prior submission or student data is readable publicly. The same public URL can be reused for future groups.

Owner review route: `/organisation-submissions`, linked from Students. Load recent batches, page through older ones, and approve/reject each student. Verify the organisation, permission, agreement and payment arrangement before approval. Organisation identity is self-reported. A verified owner ID token is required server-side for reads and review, matching existing account activation permissions.

Approval atomically creates one pending student and records its ID against the row. An email duplicate blocks approval and requires manual review in Students. Repeated approval does not create more records. Rejection creates no student or login. No payment is marked paid based on the organisation's submission. `billingResponsibility: organisation` and organisation contact details record who pays; existing contract/fee tooling still requires staff configuration. This does not yet introduce organisation invoicing or change all existing payment reminder systems.

Use **Manage student / send invitation** to open the student directory filtered by email. Configure the student's agreed class, contract, payment status and fees there, then use the existing activation panel to prepare the Firebase UID and request its password-setup email. No passwords are collected in the public form. Existing unlinked Firebase logins are rejected by account provisioning for manual investigation. Invitation state and first-sign-in state remain separate.

The learner repository's existing `onStudentCreated` / `onStudentUpdated` triggers deliver student records to the Students sheet. Approved records use their canonical student code and `syncedToSheets: false`; UID linking updates the same record. Sync begins at approval, and later setup updates sync through the existing update trigger. A submission alone does not write to students or the sheet. Verify live triggers after deployment rather than treating a frontend build as proof of delivery.

Backend: `functions/organisationEnrolment.js`, registered in the Admin `api` Firebase function; same-origin Vercel proxy in `api/router.js`. Deploy both Firebase and Vercel. Submission uses a client-generated request ID for safe retries, honeypot, explicit consent, server validation, row caps and atomic per-contact daily quota. The two new collections are server-only (existing default-deny rules); no public Firestore access is required. Quota documents contain hashed keys; expiry timestamps can use a Firestore TTL policy for housekeeping. No new scheduled job is installed.

Validation: `node --test functions/organisationEnrolment.test.cjs functions/studentAccountActivation.test.cjs tests/student-emergency-contact.test.js`; `npm run build`.

## Unexpected HTML response

The client reads response text and validates JSON before accepting success. An HTML fallback, empty response or network failure keeps all form entries and the original request ID available for retry. The Vercel proxy converts non-JSON organisation API replies to a JSON 502 instead of forwarding HTML. Do not treat this message as confirmation of a saved submission; only a reference receipt confirms it.

Regression coverage: `tests/organisation-enrolment-request.test.js` covers public submissions, retries, owner-token handling, list/review methods, validation errors, network errors, HTML/empty replies and actual Vercel router dispatch to the Firebase proxy. Backend tests cover validation, duplicates, approval, rejection, access control, idempotency and quotas.

## Delete submissions

The owner can choose **Delete submission** and confirm. This removes the submitted organisation/student details from the batch and hides it from the queue. Approved student documents, Firebase accounts and sheet rows remain untouched. A minimal deletion marker retains the reference, original creation time and deletion audit metadata so an old public retry cannot recreate the batch. Review of a deleted submission returns 404. Deleting the same reference again is safe.

## Partnership and referral programme

The public `https://www.falowen.app/partnerships` page links institutions to the existing group form. Referral applicants use a separate form, accept the versioned terms and enter the owner queue at `/referral-review` (Students → Referral applications and commissions). Verify the contact before approval, then send the approved link to the contact manually. Repeated applications and approvals preserve the original record and invitation.

Learners open the partner link, consent to matching their email, then continue to the regular Campus signup with that email. The first invitation registered for an email retains attribution. An invitation creates neither a student account nor a payment. Check attribution with the learner before approving a commission.

Open the owner queue on demand. Inspect the earliest completed tuition payment for the learner across Admin payment links and Campus webhook records. Confirm the learner’s identity, any earlier offline payments and disputes. Approval verifies the selected reference, student metadata, payment time, tuition and refunds directly with Paystack using the existing bound PAYSTACK_SECRET. The commission is 10% of tuition on the first completed payment, rounded to the nearest pesewa. A refunded first payment cannot be replaced with a later instalment. The ledger excludes institutional enrolments and self-referrals. Cash payments alone have no provider record to verify and require separate manual handling outside this ledger.

After paying a partner externally, record the payout receipt once. Use **Recheck refund with Paystack** on later review or **Cancel referral / record refund** for an offline decision. A subsequent refund cancels the commission and retains the payout history for recovery. Refund rechecks run on demand. The programme adds no scheduled jobs, public collection reads, automatic emails or money transfers.

## Organisation Paystack payments

Owner-only route `/paystack` is linked from Students and each organisation submission. Load submitted organisations (including older pages), select approved students and enter the amounts covered by the institutional agreement. Configure canonical student tuition balances, class and contract in Students first. The server rejects unknown students, different organisations, duplicate students and amounts above the outstanding balance.

The invoice stores the company billing/receipt email, agreement reference, creator, each student's gross amount and fixed GHS discount, plus a required discount reason. Discounts reduce balances separately from actual `paid` tuition. Checkout applies the existing processing-share calculation to net tuition. Generating a link does not credit accounts. One persisted request reference prevents UI network retries from creating different invoice records; changing invoice details starts a new reference. Avoid issuing multiple outstanding invoices for the same tuition obligation.

After signed `charge.success` validation, a single Firestore transaction credits all students, records their discounts, updates explicit balances and creates per-student allocation records for history. Duplicate delivery does not credit twice. Existing student update/sheet triggers receive these canonical updates (`syncedToSheets: false`); Firebase account activation and agreed contracts remain staff-managed. Group payment and allocation records are explicitly ineligible for referral commission. No new public payment-data endpoint or scheduled job is added.

The company receipt contains the payment reference, student breakdown, discounts, net tuition and checkout total. It uses the existing payment-update/announcement webhook configuration. A receipt failure leaves paid credits intact; Paystack webhook retries or the owner's **Retry company receipt** action retry delivery. **Verify with Paystack** reuses existing authenticated provider reconciliation if a webhook was missed, then attempts the company receipt. History refresh reads recorded status; it does not itself verify payment. Student payment-update emails continue independently. A delivery lease suppresses overlapping receipt retries; a crash after external email delivery but before saving its sent marker can still cause a duplicate email. Payment credits remain idempotent.

Deploy the Admin Vercel app and Firebase backend together. Existing build/deploy payment patches register `functions/organisationPayments.js`; preserve the generated-payment integration in `scripts/patchStudentPaymentLinks.mjs`, rather than editing its generated index block. The Paystack secret and signed-webhook URL remain the existing ones. No live money is charged by these tests. Verify a test-mode group payment, company email delivery and learner/sheet balance display before enabling production use.

Validation: `node --test functions/organisationPayments.test.cjs functions/organisationEnrolment.test.cjs functions/referralProgramme.test.cjs`; existing student payment patch tests; `npm run build`.
