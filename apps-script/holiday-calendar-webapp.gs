/**
 * Falowen Holiday Calendar Google Apps Script Web App
 *
 * Put this code inside the Holiday Google Sheet:
 * Extensions → Apps Script → Code.gs → Save → Deploy as Web App.
 *
 * Required Script Properties:
 * - HOLIDAYS_SYNC_SECRET: must match Firebase secret HOLIDAYS_SYNC_SECRET.
 *
 * Optional Script Properties:
 * - HOLIDAYS_SHEET_NAME: default Holidays
 * - STUDENTS_SHEET_ID: leave blank to use this same spreadsheet
 * - STUDENTS_SHEET_NAME: default Students
 * - FROM_NAME: default Learn Language Education Academy
 */

const DEFAULT_HOLIDAYS_SHEET_NAME = 'Holidays';
const DEFAULT_STUDENTS_SHEET_NAME = 'Students';
const DEFAULT_FROM_NAME = 'Learn Language Education Academy';

function doPost(e) {
  try {
    const payload = parseRequest_(e);
    assertSecret_(payload.secret);

    const action = String(payload.action || '').trim();
    if (action === 'syncHolidays') return json_({ ok: true, ...syncHolidays_(payload) });
    if (action === 'sendHolidayNotice') return json_({ ok: true, ...sendHolidayNotice_(payload) });

    return json_({ ok: false, error: `Unknown action: ${action}` });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function parseRequest_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  return JSON.parse(raw);
}

function scriptProperty_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value == null || value === '' ? fallback : value;
}

function assertSecret_(secret) {
  const expected = scriptProperty_('HOLIDAYS_SYNC_SECRET', '');
  if (!expected) throw new Error('Missing Script Property HOLIDAYS_SYNC_SECRET');
  if (String(secret || '') !== expected) throw new Error('Invalid secret');
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function activeSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function studentsSpreadsheet_() {
  const spreadsheetId = scriptProperty_('STUDENTS_SHEET_ID', '');
  return spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : activeSpreadsheet_();
}

function ensureSheet_(spreadsheet, sheetName, headers) {
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  const existingHeaders = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0];
  const missing = headers.filter((header) => existingHeaders.indexOf(header) === -1);
  if (missing.length) {
    sheet.getRange(1, existingHeaders.length + 1, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function getRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((header) => String(header || '').trim());
  return values.slice(1).map((row, index) => {
    const record = { _rowNumber: index + 2 };
    headers.forEach((header, columnIndex) => {
      record[header] = row[columnIndex];
    });
    return record;
  });
}

function headerIndexMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map((header) => String(header || '').trim());
  const map = {};
  headers.forEach((header, index) => {
    map[header] = index + 1;
  });
  return map;
}

function normalize_(value) {
  return String(value || '').trim();
}

function normalizeKey_(value) {
  return normalize_(value).toLowerCase().replace(/\s+/g, ' ');
}

function firstValue_(record, keys) {
  for (const key of keys) {
    if (record[key] != null && normalize_(record[key]) !== '') return record[key];
  }
  return '';
}

function syncHolidays_(payload) {
  const sheetName = scriptProperty_('HOLIDAYS_SHEET_NAME', DEFAULT_HOLIDAYS_SHEET_NAME);
  const headers = [
    'date',
    'name',
    'localName',
    'countryCode',
    'types',
    'schoolClosed',
    'adminNote',
    'studentMessage',
    'autoSendNotice',
    'noticeAudienceType',
    'noticeClassName',
    'noticeStatus',
    'updatedAt',
  ];
  const sheet = ensureSheet_(activeSpreadsheet_(), sheetName, headers);
  const headerMap = headerIndexMap_(sheet);
  const existingByDate = new Map(getRows_(sheet).map((row) => [normalize_(row.date || row.Date), row._rowNumber]));
  const holidays = Array.isArray(payload.holidays) ? payload.holidays : [];
  let inserted = 0;
  let updated = 0;

  holidays.forEach((holiday) => {
    const rowObject = {
      date: normalize_(holiday.date),
      name: normalize_(holiday.name),
      localName: normalize_(holiday.localName),
      countryCode: normalize_(holiday.countryCode || payload.countryCode || 'GH'),
      types: Array.isArray(holiday.types) ? holiday.types.join(', ') : normalize_(holiday.types),
      schoolClosed: holiday.schoolClosed ? 'TRUE' : 'FALSE',
      adminNote: normalize_(holiday.adminNote),
      studentMessage: normalize_(holiday.studentMessage),
      autoSendNotice: holiday.autoSendNotice ? 'TRUE' : 'FALSE',
      noticeAudienceType: normalize_(holiday.noticeAudienceType || 'all_active'),
      noticeClassName: normalize_(holiday.noticeClassName),
      noticeStatus: normalize_(holiday.noticeStatus || 'not_scheduled'),
      updatedAt: new Date(),
    };

    const existingRowNumber = existingByDate.get(rowObject.date);
    if (existingRowNumber) {
      Object.entries(rowObject).forEach(([key, value]) => {
        if (headerMap[key]) sheet.getRange(existingRowNumber, headerMap[key]).setValue(value);
      });
      updated += 1;
    } else {
      sheet.appendRow(headers.map((header) => rowObject[header]));
      inserted += 1;
    }
  });

  return { inserted, updated, total: holidays.length };
}

function isActiveStudent_(student) {
  const status = normalizeKey_(firstValue_(student, ['status', 'Status', 'accountStatus', 'Account Status']));
  const archived = normalizeKey_(firstValue_(student, ['archived', 'Archived']));
  if (['archived', 'inactive', 'deleted', 'cancelled', 'canceled'].indexOf(status) !== -1) return false;
  if (['true', 'yes', '1'].indexOf(archived) !== -1) return false;
  return true;
}

function studentClass_(student) {
  return normalize_(firstValue_(student, [
    'className',
    'ClassName',
    'Class Name',
    'class',
    'Class',
    'klass',
    'Klass',
    'level',
    'Level',
  ]));
}

function studentEmail_(student) {
  return normalize_(firstValue_(student, ['email', 'Email', 'contactEmail', 'Contact Email', 'Email Address']));
}

function studentName_(student) {
  return normalize_(firstValue_(student, ['name', 'Name', 'fullName', 'Full Name', 'Student Name'])) || 'student';
}

function loadRecipients_(audienceType, className) {
  const studentsSheetName = scriptProperty_('STUDENTS_SHEET_NAME', DEFAULT_STUDENTS_SHEET_NAME);
  const sheet = studentsSpreadsheet_().getSheetByName(studentsSheetName);
  if (!sheet) throw new Error(`Students sheet not found: ${studentsSheetName}`);

  const wantedClass = normalizeKey_(className);
  const seenEmails = new Set();
  return getRows_(sheet)
    .filter(isActiveStudent_)
    .filter((student) => audienceType !== 'class' || normalizeKey_(studentClass_(student)) === wantedClass)
    .map((student) => ({ email: studentEmail_(student), name: studentName_(student), className: studentClass_(student) }))
    .filter((recipient) => {
      if (!recipient.email || seenEmails.has(recipient.email.toLowerCase())) return false;
      seenEmails.add(recipient.email.toLowerCase());
      return true;
    });
}

function replaceTokens_(text, values) {
  let output = String(text || '');
  Object.entries(values).forEach(([key, value]) => {
    output = output.replace(new RegExp(`{${key}}`, 'g'), String(value || ''));
  });
  return output;
}

function sendHolidayNotice_(payload) {
  const audienceType = normalize_(payload.audienceType || 'all_active') === 'class' ? 'class' : 'all_active';
  const className = audienceType === 'class' ? normalize_(payload.className) : '';
  if (audienceType === 'class' && !className) throw new Error('className is required for class audience');

  const holidayName = normalize_(payload.holidayName || 'Holiday');
  const date = normalize_(payload.date);
  const studentMessage = normalize_(payload.studentMessage);
  if (!studentMessage) throw new Error('studentMessage is required');

  const recipients = loadRecipients_(audienceType, className);
  const fromName = scriptProperty_('FROM_NAME', DEFAULT_FROM_NAME);
  const subject = `No class notice: ${holidayName} (${date})`;
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors = [];

  recipients.forEach((recipient) => {
    try {
      const body = replaceTokens_(studentMessage, {
        student_name: recipient.name,
        name: recipient.name,
        class_name: recipient.className || className,
        holiday_name: holidayName,
        holiday_date: date,
        date,
      });
      GmailApp.sendEmail(recipient.email, subject, body, { name: fromName });
      sent += 1;
    } catch (error) {
      failed += 1;
      errors.push(`${recipient.email}: ${error && error.message ? error.message : error}`);
    }
  });

  if (!recipients.length) skipped += 1;

  return {
    sent,
    skipped,
    failed,
    recipientCount: recipients.length,
    errors,
    audienceType,
    className,
  };
}
