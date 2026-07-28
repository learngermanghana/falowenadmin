# Student Results: update instead of duplicate

This guide and `docs/apps-script/score-results-upsert.gs` are the maintained source of truth for the score-sheet webhook. The README points here instead of embedding a second Apps Script copy.

## Permanent result identity

Student Results treats this pair as one permanent result:

`normalized student code + canonical assignment ID`

Example:

`NABIFRANCIS921 + A2-7.18`

A later Firestore result for this pair must update the Google Sheet result. It must not append a second row merely because the score, feedback, or date changed.

## Why the previous override created a new row

The old Apps Script example used `sheet.appendRow(...)` for every request. Although Falowen sent a `dedupe_id`, that handler never searched for it, so the button labelled **Override sheet** still appended.

## Final request path

Student Results does not call `script.google.com` from the browser. The flow is:

1. The signed-in browser sends the canonical result rows and a Firebase ID token to `/api/student-results/sheet-upsert`.
2. Falowen’s same-origin server verifies the Firebase account and rejects the restricted staff account.
3. The server injects the score webhook URL, shared token and sheet selector from its environment.
4. The server calls Apps Script and returns the verified upsert receipt to the browser.

This avoids browser CORS/preflight failures without returning to an unverifiable `no-cors` append fallback.

For new deployments, prefer these server-only Vercel variables:

```bash
SCORES_WEBHOOK_URL=https://script.google.com/macros/s/<deployment-id>/exec
SCORES_WEBHOOK_TOKEN=<existing-shared-token>
SCORES_WEBHOOK_SHEET_NAME=Key
# or SCORES_WEBHOOK_SHEET_GID=<gid>
FIREBASE_API_KEY=<same-Firebase-web-api-key-used-by-the-app>
```

The server temporarily accepts the existing `VITE_...` equivalents as migration fallbacks. Do not put a real token in source code or documentation.

## Required Apps Script upgrade

1. Open the Apps Script project used by the score webhook URL.
2. Replace its score `doPost` implementation with:
   - `docs/apps-script/score-results-upsert.gs`
3. Copy the existing shared token into `SCORE_WEBHOOK_TOKEN`. Do not commit or share the real token.
4. In Apps Script, choose **Deploy → Manage deployments → Edit**.
5. Select **New version**, then deploy.
6. Keep the same `/exec` URL in Vercel unless Apps Script issues a different deployment URL.

The upgraded handler acknowledges successful requests with:

```json
{
  "ok": true,
  "action": "upsertScoreRows",
  "mode": "upsert",
  "inserted": 0,
  "updated": 1,
  "duplicatesRemoved": 1
}
```

Falowen deliberately rejects a response without this upsert acknowledgement.

## Existing duplicate cleanup

The Student Results page collapses duplicate source rows and displays only the newest result. It also reports how many older duplicates are hidden.

After the Apps Script upgrade, select the latest Firestore result and click **Update sheet row**. The webhook updates the newest matching sheet row and deletes older rows with the same canonical identity.

For the known example, the remaining row should be the latest result:

- Student code: `NABIFRANCIS921`
- Assignment ID: `A2-7.18`
- Score: `90`
- Date: the later sync time

## Regression safeguards

The automated Student Result Upsert tests verify that:

- identity ignores harmless case, spaces, underscores, and punctuation differences;
- two rows for the same student and assignment collapse to the newest row;
- bulk payloads contain only the latest incoming row for each identity;
- the browser uses an authenticated same-origin API instead of contacting Apps Script directly;
- the API verifies the Firebase user and injects private webhook settings server-side;
- the frontend and server both require an explicit upsert acknowledgement;
- the Apps Script updates rows and removes duplicates instead of using an append-only handler.
