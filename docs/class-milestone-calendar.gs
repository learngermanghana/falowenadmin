/**
 * Holiday-aware daily class reminder gate.
 * Expected Holidays sheet columns:
 * Date | Name | Country | SchoolClosed | AdminNote | StudentMessage | SyncedAt
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

    return jsonResponse_({ ok: false, error: "Unknown action" }, 400);
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || String(error) }, 500);
  }
}

function syncHolidays_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Holidays") || ss.insertSheet("Holidays");
  const headers = ["Date", "Name", "Country", "SchoolClosed", "AdminNote", "StudentMessage", "SyncedAt"];
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
