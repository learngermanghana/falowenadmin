# Attendance class-name collision safeguard

Attendance confirmation session lookup may fall back to `className` for legacy sessions. A display-name match must not override a canonical class identity.

The Firebase predeploy patch now requires `acceptClassNameSessionMatch(session, klass)` before accepting `className` query results. Sessions with a matching canonical `classRecordId`/`classId` are accepted; sessions with no canonical identifier remain eligible for legacy name matching; sessions whose canonical identifier belongs to a different class are rejected.

The Firebase production workflow also deploys `sendAttendanceConfirmationEmails` together with the API and class reminder worker so changes to this worker reach production.
