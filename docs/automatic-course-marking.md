# Automatic A1, A2 and B1 course marking

New submitted course assignments create one deterministic Firebase marking job per submission path. The worker bundles the same Admin marking service and production patches: objective parsing, level weights, question-aware writing guards, zero-score recovery and independent second examiner. Objective-only submissions avoid an AI call. Other levels and mock/speaking exam flows remain outside this worker.

Reliable results (marked, confidence >= 0.8, no review reasons/warnings or examiner disagreement) are published atomically to the submission, markingResults and scores. A private aiMarkingAudit record preserves the submitted work, reference key/version and full marking result. Missing keys, uncertain work, errors or existing assignment scores go to tutor review. Existing tutor decisions are never overwritten automatically. Only new jobs marked automatic are processed; historical submissions are not regraded.

The learner listens to its saved submission and shows marking, review or score/feedback with /campus/results. The Results page supplements Sheet results with the student's saved automatic scores so publication does not wait for Sheet refresh.

A separate Firebase outbox worker uses the existing upsertScoreRows Apps Script contract (studentcode + assignment_id), with the same stable event ID on retries. It reads the latest score before sending and retries at most five times. The existing Sheet email process remains the email sender. A Sheet failure does not erase a saved result or call the AI again. Verify the deployed Apps Script's event/row deduplication and email trigger in the staging smoke test.

## Deployment

Deploy the Admin Firebase workers and the learner frontend/rules together. The Firebase workflow includes both new workers, installs the shared bundle dependencies and rebuilds the pipeline after Admin marking patches.

Firebase Secret Manager must contain OPENAI_API_KEY (existing), SCORES_WEBHOOK_URL and SCORES_WEBHOOK_TOKEN. The two SCORES values must match the existing Admin integration hub's working score webhook settings; Vercel environment values are not automatically copied into Firebase. Existing SCORES_WEBHOOK_SHEET_NAME / VITE_SCORES_WEBHOOK_SHEET_NAME and SCORES_WEBHOOK_SHEET_GID / VITE_SCORES_WEBHOOK_SHEET_GID are preserved so the worker targets the exact existing Sheet tab. The deployment check reuses existing Firebase secrets or provisions them from the shared protected runtime config (`scores.webhook_url`, `scores.webhook_token`, `scores.sheet_name`, `scores.sheet_gid`). It never creates a new Sheet or token and stops deployment if the existing values are unavailable.

The learner rules protect marking fields from student writes and make score writes staff-only. Automatic jobs, private keys and audit records stay staff-only. No long-running Vercel endpoint, timer, polling loop or new email sender is introduced.

Before release, test one new A1, A2 and B1 assignment with test accounts and real registry entries, verify Results + one Sheet row/email, then replay the event and test a tutor correction. The worker/module tests use in-memory storage and stubbed transport; they do not prove production credentials or Apps Script email delivery.
