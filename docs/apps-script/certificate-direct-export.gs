// Reference extension for the FULL Announcements + Certificates Apps Script.
// Install this function in the existing complete project; do not replace its
// existing certificate generator, mail runner, doPost, or deduplication logic.
//
// After the existing doPost verifies body.token with getWebhookToken_(), add:
//
// if (String(body.action || '') === 'exportVerifiedCertificateFromScores') {
//   return ContentService.createTextOutput(
//     JSON.stringify(exportVerifiedCertificateFromScores_(body))
//   ).setMimeType(ContentService.MimeType.JSON);
// }
//
// See the fully patched handoff file:
//   Falowen_Announcements_Certificate_Direct_Export.gs.txt

/************ ON-DEMAND CERTIFICATE PDF EXPORT (ADMIN ONLY) ************/
// Read-only export: reuse the original certificate PDF, signature and completion
// checks. No MailApp call, send flag or certificate deduplication write.
function exportVerifiedCertificateFromScores_(payload) {
  const row = payload.row || {};
  const code = String(row.student_code || row.studentCode || row.studentcode || '')
    .trim().toLowerCase().replace(/\s+/g, '');
  const email = String(row.email || '').trim().toLowerCase();
  const level = String(payload.level || row.level || '').trim().toUpperCase();
  if (!/^(A1|A2|B1)$/.test(level)) {
    throw new Error('Certificate export currently supports German A1, A2 and B1 only.');
  }
  if (!code && !email) throw new Error('Select a student code or email.');

  // Bypass the 4-minute mail-runner cache so newly marked scores appear.
  const data = rebuildDerivedData_({
    students: loadStudents_(), scores: loadScores_(), now: new Date()
  });
  const student = code ? data.studentsByCode[code] : data.studentsByEmail[email];
  if (!student) throw new Error('Student not found in the canonical students sheet.');
  const resolvedCode = String(student.student_code || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!resolvedCode || (code && code !== resolvedCode)) {
    throw new Error('Student code does not match the students sheet.');
  }
  if (email && email !== String(student.email || '').trim().toLowerCase()) {
    throw new Error('Student code and email do not match the students sheet.');
  }

  const rows = getStudentLevelRows_(data, resolvedCode, level);
  const completion = findCompletionFromRows_(rows, resolvedCode, level);
  const status = completion && completion.status || buildRequiredStatus_(rows, level, PASS_MARK);
  if (!(completion && completion.completed && completion.passedAll &&
        status && status.passedAllRequired && status.completedRequired >= status.required)) {
    throw new Error('Certificate not yet eligible for ' + level + ': ' +
      status.passedRequired + '/' + status.required + ' required tasks passed. ' +
      'The final course assessment must also be tutor-marked and verified.');
  }

  const verifiedClassName = /kiswahili|swahili/i.test(String(student.class_name || ''))
    ? '' : (student.class_name || '');
  // A missing signature fails inside generateCertificatePdf_.
  const certificate = generateCertificatePdf_(
    student.name || 'Student', level, verifiedClassName,
    completion.date || new Date()
  );
  const bytes = certificate.getBytes();
  if (bytes.length > 2750000) throw new Error('Certificate PDF is too large for direct download.');
  return {
    ok: true,
    file_name: certificate.getName(),
    mime_type: 'application/pdf',
    data_base64: Utilities.base64Encode(bytes),
    level: level,
    required: status.required,
    passed: status.passedRequired
  };
}
