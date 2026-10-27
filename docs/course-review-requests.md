# Automatic course review requests

Falowen Admin sends one Google review request to each eligible student after the official final class session is completed.

## Source of truth

The scheduled worker reads `classes`, `classSessions`, and `students` from Firestore.

It does not trust only the manually entered class end date. It selects the highest official curriculum session for the exact class record and requires that session to have status `completed`.

A request is not sent when the final session is:

- still scheduled or live;
- cancelled;
- superseded or deleted;
- restored with **Undo completion**;
- outside the configured lookback window.

Rescheduling changes the official session time, so the review request waits for the replacement session to be completed.

## Delivery time

The Firebase scheduler runs daily at 10:00 AM in `Africa/Accra`.

By default, the final session must have been completed for at least 12 hours. Configure another delay with:

- class field `courseReviewRequestDelayHours`;
- `reviews.delay_hours` in `CLOUD_RUNTIME_CONFIG`; or
- `COURSE_REVIEW_DELAY_HOURS`.

## Review URL

URL priority:

1. class field `googleReviewUrl`;
2. class field `courseReviewRequestUrl`;
3. class field `reviewUrl`;
4. `GOOGLE_REVIEW_URL` or `COURSE_REVIEW_URL` environment variable;
5. `reviews.google_review_url` or `communication.google_review_url` in runtime config;
6. the existing Learn Language Education Academy Google Maps link used on the Falowen student-facing class page.

A direct Google **Ask for reviews** URL is preferred. The Maps link remains a safe fallback.

## Delivery

The worker sends individual rows through the existing announcement webhook. Each row includes:

- `email_type: course_review_request`;
- `show_review: TRUE`;
- `review_url` and `link`;
- an honest-review button label;
- the class name and student email.

Webhook priority follows the existing communication system and supports class-specific `courseReviewEmailDelivery` settings.

## Deduplication

Claims are stored in:

`courseReviewRequestSends/{classId_studentId_hash}`

Each student receives one request per class. Failed sends can retry; sent requests are never sent again automatically.

## Pause or override

Set either class field to `false` to suppress automatic review requests:

- `courseReviewRequestEnabled`
- `googleReviewRequestEnabled`

Set `courseReviewRequestMode` to `off`, `disabled`, or `paused` for the same result.

The complete system can also be disabled with `reviews.enabled: false` in `CLOUD_RUNTIME_CONFIG`.
