/**
 * Falowen Student + Completed Lead Delete Google Apps Script Web App
 *
 * Deploy as a Web App and set these Script Properties:
 * - STUDENT_DELETE_SYNC_SECRET: shared secret matching Firebase STUDENT_DELETE_SYNC_SECRET
 * - STUDENT_DELETE_SPREADSHEET_ID: spreadsheet containing Students and Leads
 * - STUDENT_DELETE_SHEET_NAMES: optional comma-separated student tabs to clean
 * - LEAD_DELETE_SHEET_NAME: optional, defaults to Leads
 */
const DEFAULT_STUDENT_DELETE_SHEETS = ['Students', 'Scores', 'Submissions', 'Attendance', 'Notifications'];
const DEFAULT_LEAD_DELETE_SHEET = 'Leads';

function studentDeleteProperty_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value == null || value === '' ? fallback : value;
}

function studentDeleteSpreadsheet_() {
  const spreadsheetId = studentDeleteProperty_('STUDENT_DELETE_SPREADSHEET_ID', '');
  if (!spreadsheetId) throw new Error('STUDENT_DELETE_SPREADSHEET_ID is not configured');
  return SpreadsheetApp.openById(spreadsheetId);
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

function studentDeletePhone_(value) {
  const digits = studentDeleteText_(value).replace(/\D/g, '');
  return digits.length > 9 ? digits.slice(-9) : digits;
}

function studentDeleteRowObject_(headers, row) {
  return headers.reduce((record, header, index) => {
    record[studentDeleteHeaderKey_(header)] = row[index];
    return record;
  }, {});
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

function studentDeleteLeadIsCompleted_(record) {
  const status = studentDeleteNormalize_(record.status);
  const paymentStatus = studentDeleteNormalize_(record.paymentstatus);
  const terminalStatuses = [
    'student_registered',
    'completed',
    'complete',
    'converted',
    'closed',
    'class_started_no_followup',
    'not_interested',
    'cancelled',
    'canceled',
    'archived',
  ];
  const paidStatuses = ['paid', 'registered_paid', 'success', 'successful', 'completed', 'complete'];
  return terminalStatuses.some((token) => status.indexOf(token) !== -1)
    || paidStatuses.some((token) => paymentStatus.indexOf(token) !== -1);
}

function studentDeleteLeadMatches_(record, payload) {
  const lead = payload.lead || {};
  const wantedLeadId = studentDeleteNormalize_(payload.leadId || lead.leadId || lead.id);
  const wantedEmail = studentDeleteNormalize_(payload.email || lead.email);
  const wantedPhone = studentDeletePhone_(payload.phone || lead.number || lead.phone);

  const rowLeadId = studentDeleteNormalize_(record.leadid || record.id);
  const rowEmail = studentDeleteNormalize_(record.email);
  const rowPhone = studentDeletePhone_(record.phone || record.number);

  if (wantedLeadId && rowLeadId) return wantedLeadId === rowLeadId;
  if (wantedEmail && rowEmail && wantedEmail === rowEmail) return true;
  return Boolean(wantedPhone && rowPhone && wantedPhone === rowPhone);
}

function studentDeleteAppendLeadEvent_(spreadsheet, record) {
  const eventSheet = spreadsheet.getSheetByName('LeadEvents');
  if (!eventSheet) return;
  if (eventSheet.getLastRow() === 0) {
    eventSheet.appendRow(['timestamp', 'lead_id', 'event_type', 'data_json']);
  }
  eventSheet.appendRow([
    new Date().toISOString(),
    record.leadid || '',
    'lead_deleted_from_admin',
    JSON.stringify(record),
  ]);
}

function studentDeleteCompletedLead_(spreadsheet, payload) {
  const sheetName = studentDeleteProperty_('LEAD_DELETE_SHEET_NAME', DEFAULT_LEAD_DELETE_SHEET);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Lead sheet not found: ${sheetName}`);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error('No lead rows found');
  const headers = values[0];
  const rowsToDelete = [];

  for (let index = 1; index < values.length; index += 1) {
    const record = studentDeleteRowObject_(headers, values[index]);
    if (!studentDeleteLeadMatches_(record, payload)) continue;
    if (!studentDeleteLeadIsCompleted_(record)) {
      throw new Error('Only completed, converted, registered, closed, or fully paid leads can be deleted');
    }
    studentDeleteAppendLeadEvent_(spreadsheet, record);
    rowsToDelete.push(index + 1);
  }

  if (!rowsToDelete.length) throw new Error('Lead was not found in the Leads sheet');
  rowsToDelete.reverse().forEach((rowNumber) => sheet.deleteRow(rowNumber));
  return rowsToDelete.length;
}

function studentDeleteJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const expectedSecret = studentDeleteProperty_('STUDENT_DELETE_SYNC_SECRET', '');
    if (!expectedSecret || payload.secret !== expectedSecret) throw new Error('Unauthorized');

    const spreadsheet = studentDeleteSpreadsheet_();

    if (payload.action === 'deleteLead') {
      const deletedRows = studentDeleteCompletedLead_(spreadsheet, payload);
      return studentDeleteJson_({
        ok: true,
        message: `Deleted ${deletedRows} completed lead row(s).`,
        deletedRows,
      });
    }

    if (payload.action !== 'deleteStudentAccount') throw new Error('Unsupported action');

    const identifiers = studentDeleteIdentifiers_(payload);
    if (Object.keys(identifiers).length === 0) throw new Error('No student identifiers supplied');

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

    return studentDeleteJson_({ ok: true, message: `Deleted ${result.deletedRows} Google Sheet row(s).`, ...result });
  } catch (error) {
    return studentDeleteJson_({
      ok: false,
      error: error && error.message ? error.message : 'Google Sheet cleanup failed',
    });
  }
}
