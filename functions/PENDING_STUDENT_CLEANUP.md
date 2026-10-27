# Pending student trial retention

Falowen gives unpaid trial students with `status: pending` seven days of access from a trustworthy registration/trial start timestamp.

At the end of seven full days, the account is **blocked, not deleted**. The lifecycle worker changes the student to `status: trial_expired` and stores:

- `trialExpiredAt`
- `trialPurgeAt` (30 days after trial expiry)
- `trialAccessBlockedAt`
- `trialStatus: expired`

The student record, learning data, scores, submissions, attendance history, and Firebase Authentication account are retained during that 30-day recovery window.

If the student makes a first qualifying payment during retention, Falowen keeps the same Firestore document / StudentCode, reactivates the account, clears the purge/block fields, and records `trialStatus: converted` plus `trialConvertedAt`.

Only after the 30-day recovery window ends is an unpaid `trial_expired` student eligible for permanent purge. The purge removes the Firestore student record, related learning records, attendance/check-in references, and Firebase Authentication user. Optional Google Sheet cleanup runs only at this final purge stage and must not block core deletion.

A student never enters the trial-expiry lifecycle when a paid, partially paid, or successful payment status exists or when any known paid-amount field is greater than zero.

Class-session, attendance-confirmation, and course-review email workers treat `trial_expired` as inactive so the retained record does not continue to receive normal student communications. The class-session reminder worker runs the trial lifecycle before resolving recipients.

## Trial onboarding emails

Unpaid trial students receive a deduplicated onboarding sequence through the existing Falowen Announcement webhook:

- signup / Day 0: trial welcome with direct Day 1 lesson link
- Day 3: learning reminder while trial access is still active
- Day 6: trial-ending-tomorrow reminder
- Day 7: access-paused notice explaining the 30-day recovery window and the later permanent purge

A qualifying payment stops future trial reminder emails. The Day-7 notice does not claim the account was deleted; it explains that access is paused and progress is retained during recovery.


## Existing communication connection

Trial lifecycle sheet updates reuse the existing Falowen Announcement integration. No separate student-delete URL or secret is required for the scheduled trial lifecycle.

The Firebase worker resolves the existing `ANNOUNCEMENT_WEBHOOK_URL` / `ANNOUNCEMENT_WEBHOOK_TOKEN`, or the equivalent `communication.announcement_webhook_url` / `communication.announcement_webhook_token` runtime settings. The same Apps Script webhook handles the Day-7 `trial_expired` sync and the final Day-37 sheet purge.
