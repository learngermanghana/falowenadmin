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
X-Falowen-Completion-Secret: <private shared secret>
```

Response: `application/pdf`.

## Configuration

Set the same private secret in both systems.

Firebase runtime configuration:

```json
{
  "communication": {
    "completion_document_secret": "<at least 24 random characters>"
  }
}
```

The repository already loads this from `CLOUD_RUNTIME_CONFIG`. In production, update the existing `FALOWEN_ADMIN_CLOUD_RUNTIME_CONFIG` GitHub secret with the new communication value.

In the bound Announcement spreadsheet, run:

`Falowen Announcements → Setup: Save Completion Document Secret`

The Apps Script stores it in Script Properties as `COMPLETION_DOCUMENT_SECRET`.

## Failure behavior

Completion delivery is fail-open. If the Falowen PDF endpoint is unavailable or not configured, Apps Script logs the error and still sends the existing certificate and transcript. This prevents the new document from blocking graduation emails.
