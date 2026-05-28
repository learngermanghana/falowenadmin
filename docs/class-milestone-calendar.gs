/**
 * Holiday-aware daily class reminder gate.
 * Expected Holidays sheet columns:
 * Date | Name | Country | SchoolClosed | Notes
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
