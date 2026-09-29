# Native trial email lifecycle in the Announcement Apps Script

The Announcement spreadsheet's existing five-minute Apps Script runner is the owner of Falowen trial lifecycle emails.

## Stages

- Day 0 through before Day 3: `trial_access_welcome`
- Day 3 through before Day 6: `trial_access_day3`
- Day 6 through before Day 7: `trial_access_day6`
- Day 7 until the end of the 30-day recovery window: `trial_access_expired`

The worker skips paid students and records the highest accepted stage in the Students sheet using:

- `TrialEmailStageLastSent`
- `TrialEmailLastSentAt`

This lets an existing student catch up to the current stage without receiving every missed earlier email.

## Delivery

Trial emails are appended to the normal Announcement sheet and sent through the same MailApp / Outbox / Email Delivery Log path as other Falowen communication.

The Announcement webhook remains supported for other systems. Its normal announcement POST path must:

- resolve both `Announcement` and `Announcements`;
- preserve `trial_access_*` email types;
- permit explicitly targeted `trial_access_expired` messages even though general communication is blocked after trial expiry;
- return `ok: false` when an appended row was not actually accepted or deduplicated for delivery.

## Firebase

Firebase trial email workers remain deployed only as compatibility no-ops by default. Their default delivery mode is `apps_script_native`, so they do not reserve or falsely mark trial email stages while Apps Script owns delivery.

Explicitly setting `trial_emails.delivery_mode=firebase` can re-enable the old Firebase path for controlled testing, but production should keep Apps Script native delivery.
