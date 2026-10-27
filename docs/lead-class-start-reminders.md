# Lead class-start reminder emails

Falowen Admin sends one email to an unregistered lead when the class they selected is close to starting.

## Default behavior

- The Firebase worker runs daily at 8:00am in `Africa/Accra`.
- The default reminder window is three days before the class start date.
- The window is recoverable: an eligible lead who is added one or two days before class can still receive the one reminder.
- Leads marked registered, paid, converted, closed, not interested, cancelled, archived, deleted, or already carrying a student code are skipped.
- Duplicate submissions for the same email, class and start date are collapsed.
- A Firestore claim in `leadClassStartReminderSends` ensures the communication email is sent only once for that lead and class start date.

## Data source

The worker reads the published `Leads` CSV used by the Falowen Admin leads page. The row should contain:

- `email`
- `class_name` or `level`
- `start_date`
- optional `meeting_times`, `schedule_url`, `lead_id`, `status`, `payment_status`, and `student_code`

The URL can be overridden with `LEAD_REMINDER_CSV_URL` or `lead_reminders.csv_url` in `CLOUD_RUNTIME_CONFIG`.

## Communication delivery

The job uses the existing communication/announcement webhook. Resolution order includes:

- `LEAD_CLASS_START_REMINDER_WEBHOOK_URL`
- `LEAD_REMINDER_WEBHOOK_URL`
- `ANNOUNCEMENT_WEBHOOK_URL`
- `communication.lead_class_start_reminder_webhook_url`
- `communication.lead_reminder_webhook_url`
- `communication.announcement_webhook_url`

The email is delivered as an individual row with `email_type: lead_class_start_reminder`, a `Secure your seat` button, the class name, start date and meeting times.

## Configuration

Optional values:

- `LEAD_CLASS_START_REMINDER_ENABLED=false` disables the job.
- `LEAD_CLASS_START_REMINDER_DAYS=3` changes the maximum reminder window from 1 to 30 days.
- `LEAD_REMINDER_ACCOUNT_URL` changes the fallback payment/account button.
- `lead_reminders.days_before_class`, `lead_reminders.webhook_url`, `lead_reminders.webhook_token`, `lead_reminders.sheet_name`, and `lead_reminders.sheet_gid` are supported in `CLOUD_RUNTIME_CONFIG`.

## Important migration step

Remove or disable the old Apps Script trigger named `followUpDueLeads`. Keeping both systems active can send a duplicate class-start email because Apps Script and Firebase use separate deduplication records.
