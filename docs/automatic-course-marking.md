# Automatic A1, A2 and B1 course marking

New submitted course assignments create one deterministic Firebase marking job per submission path. The worker bundles the same Admin marking service and production patches: objective parsing, level weights, question-aware writing guards, zero-score recovery and independent second examiner. Objective-only submissions avoid an AI call. Other levels and mock/speaking exam flows remain outside this worker.

Reliable passing results (score >= 60, no failed pass outcome or writing-minimum failure, marked, confidence >= 0.8, no review reasons/warnings or examiner disagreement) are published atomically to the submission, markingResults and scores. A private aiMarkingAudit record preserves the submitted work, reference key/version and full marking result. Missing keys, uncertain work, errors or existing assignment scores go to tutor review. A valid passing resubmission may replace a saved failed attempt only when its submission timestamp is demonstrably newer; passed scores and explicit manual overrides remain protected. The old score is retained in the private audit and bounded score history. Only new jobs marked automatic are processed; historical submissions are not regraded.

Completely empty submissions are handled separately: the worker skips AI and answer-key lookup, records a failed score of 0, and publishes clear feedback asking the student to add answers and resubmit. The existing Results notification returns the attempt to the learner without tutor review. Partially missing objective sections and uncertain marking evidence still require review; a missing or faulty assignment key is not treated as a student failure.

The learner listens to its saved submission and shows marking, review or score/feedback with /campus/results. The Results page supplements Sheet results with the student's saved automatic scores so publication does not wait for Sheet refresh.

The automatic worker now resolves known A1–B1 assignment keys from the same **checked-in answer dictionary** bundled into the Firebase marking pipeline, instead of trusting a potentially stale Firestore registry. Unbundled keys retain the prior Firestore fallback. Where the student submission carries an explicit `answerKeyVersion` or `markingReferenceVersion`, the worker refuses to auto-publish if the reference disagrees or is unversioned; historic untagged submissions still follow the existing legacy detection rules. A1-11 now distinguishes the current Richtig/Falsch Wegbeschreibung Teil 3 from historical 15-answer reading exercises. Inconsistent final totals, objective counts, writing marks or writing-minimum pass flags route to tutor review.

Temporary AI/network failures are classified separately from missing keys and student/score validation problems. The Firebase event is retried with a **maximum of two worker attempts**, preserving original submission data and never overwriting a previously saved tutor score. The three submission-to-job creation triggers are retry-enabled and idempotent. The Admin AI-marked panel has an owner-only, explicit **Check marking health** action; it reads at most 26 Firestore records per status and displays bounded samples (never system-wide totals), including delayed jobs and Sheet export failures. Missing jobs for particular students are still checked through Results → Saved Drafts. This adds no scheduled polling.

A separate Firebase outbox worker uses the existing upsertScoreRows Apps Script contract (studentcode + assignment_id), with the same stable event ID on retries. It reads the latest score before sending and retries at most five times. The existing Sheet email process remains the email sender. A Sheet failure does not erase a saved result or call the AI again. Verify the deployed Apps Script's event/row deduplication and email trigger in the staging smoke test.

## Deployment

Deploy the Admin Firebase workers and the learner frontend/rules together. The Firebase workflow includes both new workers, installs the shared bundle dependencies and rebuilds the pipeline after Admin marking patches.

Firebase Secret Manager must contain OPENAI_API_KEY (existing), SCORES_WEBHOOK_URL and SCORES_WEBHOOK_TOKEN. The two SCORES values must match the existing Admin integration hub's working score webhook settings; Vercel environment values are not automatically copied into Firebase. Existing SCORES_WEBHOOK_SHEET_NAME / VITE_SCORES_WEBHOOK_SHEET_NAME and SCORES_WEBHOOK_SHEET_GID / VITE_SCORES_WEBHOOK_SHEET_GID are preserved so the worker targets the exact existing Sheet tab. The deployment check reuses existing Firebase secrets or provisions them from the shared protected runtime config (`scores.webhook_url`, `scores.webhook_token`, `scores.sheet_name`, `scores.sheet_gid`). It never creates a new Sheet or token and stops deployment if the existing values are unavailable.

The learner rules protect marking fields from student writes and make score writes staff-only. Automatic jobs, private keys and audit records stay staff-only. No long-running Vercel endpoint, timer, polling loop or new email sender is introduced.

Before release, test one new A1, A2 and B1 assignment with test accounts and real registry entries, verify Results + one Sheet row/email, then replay the event and test a tutor correction. The worker/module tests use in-memory storage and stubbed transport; they do not prove production credentials or Apps Script email delivery.

## Marking inbox and release policy

Valid passing assessments publish and create their Sheet outbox automatically. Failed assessments retain their AI evidence for tutor review before publication. Missing keys, conflicting totals, service errors and unverified speaking evidence remain marking issues; they are not treated as student failures. Objective-only results legitimately carry null writing fields, which must not be validated as invalid writing marks. Real non-null out-of-range writing marks still block publication.

The inbox defaults to unpublished work and provides Failed results, Marking issues, Published and All results views, with student/assignment search and level filtering. Queries page by createdAt descending, 25 rows at a time. Counts and filters cover loaded rows only; Load more retrieves older results. Diagnostics stay collapsed until opened and checked explicitly. No new polling or scheduled AI calls are introduced.

The inbox uses the existing single-field date index, filters each bounded page by source and advances its raw cursor even for pages containing other sources. No new composite index is required. Deploy the Admin marking worker for the publication-policy and null-writing validation fixes. Previously held jobs are not automatically replayed or approved; review their original evidence individually.

Missing legacy display names are resolved on each loaded page from the exact submission and registered student. Only unnamed rows are enriched, reads are bounded by page size and no polling is added. New results preserve registered studentName and first/last name aliases as well as name/fullName.

## Named matching answers

For known choice questions, the shared comparison accepts a capitalized person name followed by a single option letter (for example, `Jonas a` or `Herr und Frau Weber X`). It tolerates pasted tabs and invisible formatting characters while retaining the submitted text in review details. This fallback does not alter reference-key parsing or free-text marking. Ambiguous suffixes and prose do not qualify. Flattened reports with explicit Teil headings also recognise numbered named choices. Genuine letter mismatches still count as wrong. Existing held or published results are not regraded automatically; a tutor must rerun marking and review before saving.

Explicitly labelled objective sections are isolated: when Lesen/Teil 3 is present and Hören/Teil 4 is absent or empty, listening answers remain missing. API reconciliation and the deterministic checker must not fall back to the whole submission for that missing part. Unlabelled legacy submissions retain the existing fallback. Missing required questions remain in the total, with blank submitted values for tutor review; this does not infer completion or change the writing-evidence review gate.

## Manual marking without a retrievable submission

The owner-only Marking page has a Manual marking tab. Select a registered student, course level and canonical lesson day to load the bundled answer reference and writing prompt. Review the emailed work outside this form, enter the final score and feedback, then save through the existing score integration and Firestore mirror. A submission ID or pasted student work is not required. The saved row records the external-work source and tutor review reason. Existing grades are blocked from accidental replacement; review them in Results before making a correction.

Saved-work retrieval is optional and starts only when clicked. It uses the selected student code and level and displays only exact assignment matches. Retrieval failure or an absent submission does not prevent manual grading. Selection changes clear the assessment and discard late retrieval responses. Switching to the Manual marking tab does not mount the incoming submission queue or fetch student submissions automatically. The tab does not send an email request to the student.

The bundled B1 Day 24 reference is aligned with learner PR #3407 (five approved questions; A, B, A, C, A). Release the learner questions before the Admin snapshot sync. Historical work from the previous optional-listening period needs individual review against the content available at submission time.
