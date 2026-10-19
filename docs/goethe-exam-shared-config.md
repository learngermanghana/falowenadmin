# Shared Goethe Exam File configuration

Falowen Admin is the single editor for Goethe exam dates, registration windows and reminder policy.

## Shared endpoint

`https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/exam-file/config`

- `GET` is public and returns the published schedule for Falowen and Google Apps Script.
- `PUT` requires a Falowen Admin Firebase ID token.
- Data is stored at `publicConfig/goetheExamFile` in the shared Firebase project.
- When no document has been published yet, the endpoint returns the versioned built-in schedule.

## Admin workflow

1. Sign in to Falowen Admin.
2. Open **Goethe Exam File** from the navigation.
3. Update A1–C1 exam dates, registration opening/closing dates, prices, links and reminder settings.
4. Select **Publish Goethe settings** once.

The student Exam File and Study Calendar reload the same configuration and keep a seven-day last-known-good browser cache.

## Google Apps Script workflow

Use the shared-config version of the Goethe reminder script. Run these functions once after replacing the old script:

1. `testSharedGoetheConfigConnection`
2. `installAllGoetheReminderTriggers`

The installation creates one `runGoetheReminderDispatcher` trigger every 15 minutes. The dispatcher reads the current Admin settings and invokes:

- standard reminders on configured days before registration;
- the Goethe account-setup email;
- urgent opening-window reminders.

Delivery dedupe remains keyed by student, level, campaign type, campaign slot and exact registration date.

## Failure behavior

The Apps Script caches the endpoint response for 15 minutes and stores the last successful configuration in Script Properties. If the endpoint is temporarily unavailable, it uses that last-known-good copy. A built-in exact A1/A2/B1 fallback is used only when no previous successful response exists.
