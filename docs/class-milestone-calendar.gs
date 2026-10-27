/**
 * Holiday-aware daily class reminder gate.
 * Expected Holidays sheet columns:
 * Date | Name | Country | SchoolClosed | AdminNote | StudentMessage | AutoSendNotice | NoticeAudienceType | NoticeClassName | NoticeStatus | SyncedAt
 */
function shouldSkipDailyReminderForHoliday_(today) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Holidays");
  if (!sheet) return { skip: false, reason: "NO_HOLIDAY_SHEET" };

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { skip: false, reason: "NO_HOLIDAY_ROWS" };

  const todayIso = Utilities.formatDate(today, "UTC", "yyyy-MM-dd");

  for (let i = 1; i < values.length; i += 1) {
    const [dateValue, name, country, schoolClosedValue] = values[i];
    const holidayIso = normalizeHolidayDate_(dateValue);
    if (!holidayIso || holidayIso !== todayIso) continue;

    const closed = normalizeSchoolClosed_(schoolClosedValue);
    if (closed) {
      Logger.log(`HOLIDAY_SKIP ${todayIso} ${country || ""} ${name || ""}`);
      return { skip: true, reason: "HOLIDAY_SKIP", holiday: { name, country, todayIso } };
    }
  }

  return { skip: false, reason: "NO_MATCH" };
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("HOLIDAYS_SYNC_SECRET");

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, error: "Unauthorized" }, 401);
    }

    if (payload.action === "syncHolidays") {
      return jsonResponse_(syncHolidays_(payload));
    }

    if (payload.action === "sendHolidayNotice") {
      return jsonResponse_(sendHolidayNotice_(payload));
    }

    return jsonResponse_({ ok: false, error: "Unknown action" }, 400);
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || String(error) }, 500);
  }
}

function syncHolidays_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Holidays") || ss.insertSheet("Holidays");
  const headers = ["Date", "Name", "Country", "SchoolClosed", "AdminNote", "StudentMessage", "AutoSendNotice", "NoticeAudienceType", "NoticeClassName", "NoticeStatus", "SyncedAt"];
  ensureHolidayHeaders_(sheet, headers);

  const existingRowsByKey = getHolidayRowIndex_(sheet);
  const holidays = Array.isArray(payload.holidays) ? payload.holidays : [];
  const syncedAt = new Date();
  let updated = 0;
  let inserted = 0;

  holidays.forEach((holiday) => {
    const date = String(holiday.date || "").trim();
    const country = String(holiday.countryCode || payload.countryCode || "").trim().toUpperCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !country) return;

    const key = holidayKey_(date, country);
    const rowValues = [
      date,
      String(holiday.name || holiday.localName || "").trim(),
      country,
      holiday.schoolClosed ? "YES" : "NO",
      String(holiday.adminNote || ""),
      String(holiday.studentMessage || ""),
      holiday.autoSendNotice ? "YES" : "NO",
      String(holiday.noticeAudienceType || "all_active"),
      String(holiday.noticeClassName || ""),
      String(holiday.noticeStatus || "not_scheduled"),
      syncedAt,
    ];

    const existingRow = existingRowsByKey[key];
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowValues]);
      updated += 1;
    } else {
      sheet.appendRow(rowValues);
      existingRowsByKey[key] = sheet.getLastRow();
      inserted += 1;
    }
  });

  return {
    ok: true,
    action: "syncHolidays",
    year: payload.year,
    countryCode: payload.countryCode,
    synced: updated + inserted,
    updated,
    inserted,
  };
}

function sendHolidayNotice_(payload) {
  const date = String(payload.date || "").trim();
  const country = String(payload.countryCode || "").trim().toUpperCase();
  const holidayName = String(payload.holidayName || "Holiday").trim() || "Holiday";
  const studentMessage = String(payload.studentMessage || "").trim();
  const audienceType = String(payload.audienceType || "all_active").trim() === "class" ? "class" : "all_active";
  const className = String(payload.className || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date must be YYYY-MM-DD");
  if (!country) throw new Error("countryCode is required");
  if (!studentMessage) throw new Error("studentMessage is required");
  if (audienceType === "class" && !className) throw new Error("className is required for class audience");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName("HolidayNoticeLog") || ss.insertSheet("HolidayNoticeLog");
  const headers = ["Date", "Country", "Holiday", "Email", "Name", "ClassName", "SentAt", "Status"];
  ensureHolidayHeaders_(logSheet, headers);

  const sentKeys = getHolidayNoticeSentKeys_(logSheet);
  const recipients = getHolidayNoticeRecipients_(ss, audienceType, className);
  const sentAt = new Date();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  recipients.forEach((recipient) => {
    const email = String(recipient.email || "").trim().toLowerCase();
    if (!email || !isValidEmail_(email)) {
      skipped += 1;
      return;
    }

    const key = holidayNoticeLogKey_(date, country, email);
    if (sentKeys[key]) {
      skipped += 1;
      return;
    }

    try {
      MailApp.sendEmail({
        to: email,
        subject: `Falowen Class Notice: ${holidayName}`,
        body: `Hello ${recipient.name || "Student"},\n\n${studentMessage}\n\nHoliday: ${holidayName}\nDate: ${date}\n\nRegards,\nFalowen / Learn Language Education Academy`,
      });
      logSheet.appendRow([date, country, holidayName, email, recipient.name || "", recipient.className || "", sentAt, "SENT"]);
      sentKeys[key] = true;
      sent += 1;
    } catch (error) {
      logSheet.appendRow([date, country, holidayName, email, recipient.name || "", recipient.className || "", sentAt, `FAILED: ${error.message || error}`]);
      failed += 1;
    }
  });

  return { ok: true, sent, skipped, failed };
}

function getHolidayNoticeSentKeys_(sheet) {
  const sentKeys = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return sentKeys;

  const values = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 8)).getValues();
  values.forEach((row) => {
    const date = normalizeHolidayDate_(row[0]);
    const country = String(row[1] || "").trim().toUpperCase();
    const email = String(row[3] || "").trim().toLowerCase();
    const status = String(row[7] || "").trim().toUpperCase();
    if (date && country && email && status === "SENT") {
      sentKeys[holidayNoticeLogKey_(date, country, email)] = true;
    }
  });
  return sentKeys;
}

function holidayNoticeLogKey_(date, country, email) {
  return `${date}__${country}__${email}`;
}

function getHolidayNoticeRecipients_(ss, audienceType, selectedClassName) {
  const sheet = findFirstSheet_(ss, ["Students", "Published Students", "Student List", "Class List", "Students Data"]);
  if (!sheet) throw new Error("Student sheet not found");

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map((value) => String(value || "").trim().toLowerCase().replace(/\s+/g, ""));
  const emailIndex = findHeaderIndex_(headers, ["email", "emailaddress", "studentemail"]);
  const nameIndex = findHeaderIndex_(headers, ["name", "studentname", "fullname"]);
  const classIndex = findHeaderIndex_(headers, ["classname", "class", "group", "groupname", "level"]);
  const statusIndex = findHeaderIndex_(headers, ["status", "studentstatus", "paymentstatus"]);
  const activeIndex = findHeaderIndex_(headers, ["active", "isactive"]);

  if (emailIndex < 0) throw new Error("Student email column not found");

  const selectedClassKey = normalizeClassKey_(selectedClassName);
  const recipientsByEmail = {};

  for (let i = 1; i < values.length; i += 1) {
    const row = values[i];
    const email = String(row[emailIndex] || "").trim().toLowerCase();
    if (!email || !isValidEmail_(email)) continue;

    const rowClassName = classIndex >= 0 ? String(row[classIndex] || "").trim() : "";
    if (audienceType === "class" && normalizeClassKey_(rowClassName) !== selectedClassKey) continue;
    if (!isHolidayNoticeActiveStudent_(row, statusIndex, activeIndex)) continue;

    recipientsByEmail[email] = {
      email,
      name: nameIndex >= 0 ? String(row[nameIndex] || "").trim() : "Student",
      className: rowClassName,
    };
  }

  return Object.keys(recipientsByEmail).map((email) => recipientsByEmail[email]);
}

function findFirstSheet_(ss, names) {
  for (let i = 0; i < names.length; i += 1) {
    const sheet = ss.getSheetByName(names[i]);
    if (sheet) return sheet;
  }
  return null;
}

function findHeaderIndex_(headers, names) {
  for (let i = 0; i < names.length; i += 1) {
    const index = headers.indexOf(names[i]);
    if (index >= 0) return index;
  }
  return -1;
}

function isHolidayNoticeActiveStudent_(row, statusIndex, activeIndex) {
  if (activeIndex >= 0) {
    const activeText = String(row[activeIndex] || "").trim().toLowerCase();
    if (["no", "false", "0", "inactive", "archived"].indexOf(activeText) >= 0) return false;
  }

  if (statusIndex < 0) return true;
  const statusText = String(row[statusIndex] || "").trim().toLowerCase();
  if (!statusText) return true;
  return ["inactive", "suspended", "blocked", "deleted", "archived"].indexOf(statusText) < 0;
}

function normalizeClassKey_(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function ensureHolidayHeaders_(sheet, headers) {
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeaderUpdate = headers.some((header, index) => currentHeaders[index] !== header);
  if (needsHeaderUpdate) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getHolidayRowIndex_(sheet) {
  const rowsByKey = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return rowsByKey;

  const values = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 3)).getValues();
  values.forEach((row, index) => {
    const date = normalizeHolidayDate_(row[0]);
    const country = String(row[2] || "").trim().toUpperCase();
    if (date && country) rowsByKey[holidayKey_(date, country)] = index + 2;
  });

  return rowsByKey;
}

function holidayKey_(date, country) {
  return `${date}__${country}`;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeHolidayDate_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    return Utilities.formatDate(value, "UTC", "yyyy-MM-dd");
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (isNaN(parsed)) return "";
  return Utilities.formatDate(parsed, "UTC", "yyyy-MM-dd");
}

function normalizeSchoolClosed_(value) {
  const text = String(value || "").trim().toLowerCase();
  return text === "yes" || text === "true" || text === "1";
}

/**
 * Integrate this guard into your existing daily reminder function:
 * const holidayGate = shouldSkipDailyReminderForHoliday_(new Date());
 * if (holidayGate.skip) return;
 */
