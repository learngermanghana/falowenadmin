/**
 * Falowen Student Delete Google Apps Script Web App
 *
 * Deploy as a Web App and set these Script Properties:
 * - STUDENT_DELETE_SYNC_SECRET: shared secret matching Firebase STUDENT_DELETE_SYNC_SECRET
 * - STUDENT_DELETE_SPREADSHEET_ID: optional; leave blank to use the active spreadsheet
 * - STUDENT_DELETE_SHEET_NAMES: comma-separated tabs to clean, defaults to Students,Scores,Submissions,Attendance,Notifications
 */
const DEFAULT_STUDENT_DELETE_SHEETS = ['Students', 'Scores', 'Submissions', 'Attendance', 'Notifications'];

function studentDeleteProperty_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value == null || value === '' ? fallback : value;
}

function studentDeleteSpreadsheet_() {
  const spreadsheetId = studentDeleteProperty_('STUDENT_DELETE_SPREADSHEET_ID', '');
  return spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
}

function studentDeleteSheetNames_() {
  const raw = studentDeleteProperty_('STUDENT_DELETE_SHEET_NAMES', DEFAULT_STUDENT_DELETE_SHEETS.join(','));
  return raw.split(',').map((name) => String(name || '').trim()).filter(Boolean);
}

function studentDeleteNormalize_(value) {
  return String(value || '').trim().toLowerCase();
}

function studentDeleteHeaderKey_(value) {
  return studentDeleteNormalize_(value).replace(/[^a-z0-9]/g, '');
}

function studentDeleteText_(value) {
  return String(value == null ? '' : value).trim();
}

function studentDeleteIdentifiers_(payload) {
  const student = payload.student || {};
  const values = [
    payload.studentId,
    payload.studentCode,
    payload.email,
    student.id,
    student.uid,
    student.studentCode,
    student.studentcode,
    student.email,
  ];
  const exact = {};
  values.map(studentDeleteText_).filter(Boolean).forEach((value) => {
    exact[studentDeleteNormalize_(value)] = true;
  });
  return exact;
}

function studentDeleteRowMatches_(headers, row, identifiers) {
  const identityHeaders = {
    id: true,
    uid: true,
    studentid: true,
    studentcode: true,
    studentcodelegacy: true,
    code: true,
    email: true,
    studentemail: true,
  };
  return headers.some((header, index) => {
    if (!identityHeaders[studentDeleteHeaderKey_(header)]) return false;
    const value = studentDeleteNormalize_(row[index]);
    return value && identifiers[value];
  });
}

function studentDeleteFromSheet_(sheet, identifiers) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;
  const headers = values[0];
  const rowsToDelete = [];
  for (let index = 1; index < values.length; index += 1) {
    if (studentDeleteRowMatches_(headers, values[index], identifiers)) rowsToDelete.push(index + 1);
  }
  rowsToDelete.reverse().forEach((rowNumber) => sheet.deleteRow(rowNumber));
  return rowsToDelete.length;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const expectedSecret = studentDeleteProperty_('STUDENT_DELETE_SYNC_SECRET', '');
    if (!expectedSecret || payload.secret !== expectedSecret) throw new Error('Unauthorized');
    if (payload.action !== 'deleteStudentAccount') throw new Error('Unsupported action');

    const identifiers = studentDeleteIdentifiers_(payload);
    if (Object.keys(identifiers).length === 0) throw new Error('No student identifiers supplied');

    const spreadsheet = studentDeleteSpreadsheet_();
    const result = { deletedRows: 0, sheets: {} };
    studentDeleteSheetNames_().forEach((sheetName) => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        result.sheets[sheetName] = { status: 'missing', deletedRows: 0 };
        return;
      }
      const deletedRows = studentDeleteFromSheet_(sheet, identifiers);
      result.deletedRows += deletedRows;
      result.sheets[sheetName] = { status: 'checked', deletedRows };
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: `Deleted ${result.deletedRows} Google Sheet row(s).`, ...result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error && error.message ? error.message : 'Student sheet cleanup failed' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
