# Student profile ↔ master Google Sheet synchronization

This is an explicit staff-triggered mirror of supported profile edits from
Firestore to the *existing* master \`students\` Google Sheet. It is not a bulk
two-way synchronization service or an automatic migration of old rows.

## Configuration (required for live synchronization)

1. Deploy the updated \`apps-script/student-delete-webapp.gs\` as the *same*
   authenticated Apps Script Web App used to maintain the master student sheet.
   Updating the GitHub source alone **does not deploy the Apps Script**.
2. Configure Apps Script properties:
   - \`STUDENT_DELETE_SYNC_SECRET\` — existing shared secret.
   - \`STUDENT_DELETE_SPREADSHEET_ID\` — existing master students spreadsheet.
   - \`STUDENT_PROFILE_SHEET_NAME=students\` (optional; default is \`students\`).
3. Configure the existing Firebase Admin API runtime with
   \`student_profile_sheet.webhook_url\` and \`student_profile_sheet.sync_secret\`
   inside \`CLOUD_RUNTIME_CONFIG\` (or the current equivalent), or set
   \`STUDENT_PROFILE_SHEET_WEBHOOK_URL\` and
   \`STUDENT_PROFILE_SHEET_SYNC_SECRET\` as server-only env variables.
   Older \`STUDENT_DELETE_APPS_SCRIPT_URL\` / \`STUDENT_DELETE_SYNC_SECRET\`
   server env values are supported as fallback **when present**.
   Do not put secrets in \`VITE_*\` client variables.
4. Deploy the Admin API and frontend. No new scheduled function, database,
   queue, or Google Sheet is required.

## Mapping and safety

\`name→Name\`, \`phone→Phone\`, \`location→Location\`, \`level→Level\`,
\`balanceDue→Balance\`, \`contractStart→ContractStart\`,
\`contractEnd→ContractEnd\`, \`studentCode→StudentCode\`,
\`email→Email\`, \`status→Status\`.

Other student attributes remain Firestore-only until explicitly mapped with
business rules and proven master-sheet headers. Do not map \`paymentStatus\` to
\`Status\`, \`tuitionFee\` to \`Paid\`, or overwrite \`LastPaidRecorded\`.
Class transfers have their own workflow. The script:
- matches exactly one existing row (UID preferred, then student code, then email);
- rejects ambiguous or disagreeing identities;
- never appends a row, adds columns, or replaces whole rows;
- verifies every changed cell after writing;
- leaves reminders, payments and notification columns untouched.

The Admin **Save student** action first saves Firestore changes. For mapped
fields, it persists \`studentProfileSheetSync\` status: \`pending\`, \`synced\`,
or \`failed\` with verified row, fields, timestamp and an actionable error.
The Class and contract tab shows this state and offers **Retry sheet sync**.
The retry reads current Firestore values; it never reapplies a stale value from
an earlier request. Only authenticated authorized staff may invoke the routes.

A failed sheet sync does **not** roll back the Firestore edit; the UI must
show both outcomes. The script response must confirm \`verified=true\`,
\`matchedRows=1\` and exactly the requested \`verifiedFields\` before Admin
displays *Synced*.

## Release checks

1. Run \`node --test tests/student-profile-sheet-sync.test.js
   tests/student-profile-update-api.test.js\`, the release guard tests,
   and functions syntax checks.
2. Deploy the script and server config **before** expecting Sync in Admin.
3. Test one existing student with a known UID, code and email, preferably a
   nonproduction test account. Change *only* \`contractEnd\`.
4. Confirm Firestore matches Admin, exactly one master-sheet row changes,
   and \`studentProfileSheetSync.status\` is \`synced\`.
5. Confirm \`LastPaidRecorded\`, reminder dates, attendance, class and receipt
   records are byte-for-byte unchanged.
6. Temporarily disable script access in a staging environment: verify the
   Firestore save remains visible, sync is *failed*, and retry succeeds after
   restoring access.
7. Verify duplicate identity rows produce *failed*, with no row modified.

This update is deliberately non-mutating until a staff member saves or retries
a student. It does not alter Leonard Baidoo's contract or run a mass backfill.
