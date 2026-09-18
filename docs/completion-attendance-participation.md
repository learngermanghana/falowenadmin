# Completion Attendance & Class Participation document

Falowen's completion pack now supports a third document in addition to the existing course certificate and score transcript.

## Ownership

- **Falowen Firebase API** calculates official attendance and Presenter participation and renders the two-page PDF.
- **Announcements + Certificates Apps Script** keeps generating the existing course certificate and transcript.
- The Apps Script completion watcher fetches the Falowen PDF and adds it to the same completion email.

## PDF content

Page 1 is the **Certificate of Attendance**:
- student name and student code;
- course level and class;
- scheduled teaching sessions;
- present, late, absent and excused counts;
- attendance rate;
- issue date and stable document ID.

Page 2 is the **Class Participation Record**:
- Presenter lessons tracked;
- lessons participated in and participation rate;
- turns, correct responses, needs-review responses and skipped opportunities;
- strong concepts and recommended review concepts;
- a clear statement that participation is diagnostic learning data and does not change grades or official attendance.

## API

`POST /completion/attendance-participation-document`

The endpoint is served by the existing `falowenadmin:api` Firebase function.

Request body:

```json
{
  "student_code": "STUDENT123",
  "email": "student@example.com",
  "class_name": "B1 Accra",
  "level": "B1",
  "completion_date": "2026-09-18T10:00:00.000Z"
}
```

Authentication header:

```
X-Falowen-Announcement-Token: <existing announcement webhook token>
```

Response: `application/pdf`.

## Configuration

**No new completion-document secret is required.**

The endpoint reuses the Announcement webhook token Falowen already uses for the working Announcement integration. It resolves the existing server-side `ANNOUNCEMENT_WEBHOOK_TOKEN`, `communication.announcement_webhook_token`, or legacy `communication.webhook_token`.

The bound Announcement Apps Script already stores the same token in Script Properties as `ANNOUNCEMENT_WEBHOOK_TOKEN` through:

`Falowen Announcements → Setup: Save Webhook Token`

The completion PDF helper calls the existing `getWebhookToken_()`, so there is no second setup menu item and no additional Firebase runtime value to create.

## Failure behavior

Completion delivery is fail-open. If the Falowen PDF endpoint is unavailable or not configured, Apps Script logs the error and still sends the existing certificate and transcript. This prevents the new document from blocking graduation emails.
