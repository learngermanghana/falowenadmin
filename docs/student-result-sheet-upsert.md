# Student Results: update instead of duplicate

## Permanent result identity

Student Results treats this pair as one permanent result:

`normalized student code + canonical assignment ID`

Example:

`NABIFRANCIS921 + A2-7.18`

A later Firestore result for this pair must update the Google Sheet result. It must not append a second row merely because the score, feedback, or date changed.

## Why the previous override created a new row

The old Apps Script example used `sheet.appendRow(...)` for every request. Although Falowen sent a `dedupe_id`, that handler never searched for it, so the button labelled **Override sheet** still appended.

## Required Apps Script upgrade

1. Open the Apps Script project used by `VITE_SCORES_WEBHOOK_URL`.
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

Falowen deliberately rejects a response without this upsert acknowledgement. It does not send the old `no-cors` fallback, because an unverifiable fallback could append another duplicate.

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
- the frontend requires an explicit upsert acknowledgement;
- the Apps Script updates rows and removes duplicates instead of using an append-only handler.
