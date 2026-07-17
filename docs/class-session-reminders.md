# Session-based class reminder emails

Falowen Admin is the source of truth for 30-minute and 10-minute class reminders.

## Source data

The scheduled Firebase worker reads the actual `classSessions` documents. Reminder emails therefore use:

- the exact session date and time;
- the session topic;
- all grouped assignment IDs;
- the class and Zoom details;
- the exact class record assigned to each student.

## Suppression

A reminder is not sent when any of these conditions is true:

- session status is `cancelled`, `completed`, `superseded` or `deleted`;
- `remindersSuppressed` is `true`;
- the session is marked school/holiday closed;
- the matching `holidayCalendar/GH_YYYY-MM-DD` record has `schoolClosed: true`;
- the date appears in the class `holidayDatesExcluded` list;
- the class or student is inactive.

Rescheduling updates `startsAt`. The reminder dedupe key includes the new start time, so only the new schedule is used.

## Delivery

The worker runs every five minutes and sends through the existing announcement webhook. It uses the class-specific delivery configuration when available, then falls back to:

- `communication.class_reminder_webhook_url`; or
- `communication.announcement_webhook_url`; or
- `CLASS_REMINDER_WEBHOOK_URL` / `ANNOUNCEMENT_WEBHOOK_URL`.

Delivery claims are stored in `classReminderSends`. Duplicate aliases for one official session are collapsed before sending.

## Legacy Apps Script

Do not keep the old weekday-only 30/10-minute reminder loop active after this Firebase worker is deployed, or students can receive duplicate reminders. The Apps Script can continue handling orientation, midpoint, end-of-course and other unrelated mail.
