# Live class curriculum contract

Falowen Admin writes live-class curriculum metadata to both `classSessions/{sessionId}` and the mirrored attendance session document at `attendance/{classId}/sessions/{sessionId}`.

The shared fields are:

- `topic`
- `assignmentIds`
- `chapterIds`
- `curriculumIds`

All three ID arrays contain the same canonical assignment IDs. New sessions are mapped in chronological order from the selected level's course dictionary. Existing sessions are repaired when the class dashboard opens only when curriculum data is missing; populated manual mappings and topics are retained.

Student-facing Falowen clients should read `assignmentIds` first, then fall back to `chapterIds`, `curriculumIds`, and legacy `assignment_id`.
