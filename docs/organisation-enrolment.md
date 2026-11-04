# Organisation enrolment

Public route: `/organisation-enrolment`. No organisation login or CSV upload. The organisation enters contact details once, types student rows or pastes tab-separated cells, and submits up to 50 students. Blank rows are ignored; name, student email, phone and level are required. No prior submission or student data is readable publicly. The same public URL can be reused for future groups.

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
