/**
 * Falowen Announcement webhook with event-level idempotency.
 *
 * Reference webhook adapter for the full Announcements/Certificates worker.
 * Do NOT replace the production 5-minute runner, certificate functions or
 * branded templates with this abbreviated example.
 *
 * Required Script Property:
 *   ANNOUNCEMENT_WEBHOOK_TOKEN
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const configuredToken = String(
      PropertiesService.getScriptProperties().getProperty("ANNOUNCEMENT_WEBHOOK_TOKEN") || ""
    ).trim();
    if (!configuredToken || String(body.token || "") !== configuredToken) {
      return announcementJson_({ ok: false, error: "Unauthorized" });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = announcementTargetSheet_(spreadsheet, body);
    if (!sheet) return announcementJson_({ ok: false, error: "Target sheet not found" });

    const rows = Array.isArray(body.rows) ? body.rows : (body.row ? [body.row] : []);
    if (!rows.length) return announcementJson_({ ok: false, error: "No row payload" });

    const eventId = String(
      body.event_id ||
      body.idempotency_key ||
      rows[0].event_id ||
      rows[0].idempotency_key ||
      ""
    ).trim();

    const headerMap = announcementEnsureHeaders_(sheet, [
      "announcement",
      "class",
      "date",
      "link",
      "topic",
      "email",
      "attach_certificate",
      "cert_level",
      "event_id", "email_type", "subject", "show_progress",
      "show_review", "show_app_button", "show_class", "show_date",
      "attendance_json", "link_label",
    ]);

    let inserted = 0;
    let duplicates = 0;
    rows.forEach(function(row, index) {
      const rowEventId = String(row.event_id || row.idempotency_key ||
        (eventId && (rows.length === 1 ? eventId : eventId + ":row_" + (index + 1))) || "").trim();

      // A batch may contain repeated rows with the same stable event. Skip any
      // event that is already present, including one inserted earlier in this batch.
      if (rowEventId && announcementEventExists_(sheet, headerMap.event_id, rowEventId)) {
        duplicates += 1;
        return;
      }

      const values = new Array(sheet.getLastColumn()).fill("");
      values[headerMap.announcement - 1] = row.announcement || row.body || "";
      values[headerMap.class - 1] = row.class || "";
      values[headerMap.date - 1] = row.date || new Date().toISOString().slice(0, 10);
      values[headerMap.link - 1] = row.link || "";
      values[headerMap.topic - 1] = row.topic || row.title || row.subject || "";
      values[headerMap.email - 1] = row.email || "";
      values[headerMap.attach_certificate - 1] = row.attach_certificate || "FALSE";
      values[headerMap.cert_level - 1] = row.cert_level || "";
      values[headerMap.event_id - 1] = rowEventId;
      values[headerMap.email_type - 1] = row.email_type || "general";
      values[headerMap.subject - 1] = row.subject || row.topic || "";
      values[headerMap.show_progress - 1] = row.show_progress ?? "FALSE";
      values[headerMap.show_review - 1] = row.show_review ?? "FALSE";
      values[headerMap.show_app_button - 1] = row.show_app_button ?? "TRUE";
      values[headerMap.show_class - 1] = row.show_class ?? "TRUE";
      values[headerMap.show_date - 1] = row.show_date ?? "TRUE";
      values[headerMap.attendance_json - 1] = row.attendance_json || "";
      values[headerMap.link_label - 1] = row.link_label || "";

      sheet.appendRow(values);
      inserted += 1;
    });

    return announcementJson_({
      ok: true,
      count: inserted,
      duplicate: inserted === 0 && duplicates > 0,
      duplicates: duplicates,
      event_id: eventId,
    });
  } catch (error) {
    return announcementJson_({ ok: false, error: String(error && error.message || error) });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function announcementTargetSheet_(spreadsheet, body) {
  if (body.sheet_gid) {
    return spreadsheet.getSheets().find(function(sheet) {
      return String(sheet.getSheetId()) === String(body.sheet_gid);
    }) || null;
  }
  if (body.sheet_name) return spreadsheet.getSheetByName(String(body.sheet_name));
  return spreadsheet.getSheetByName("Announcements");
}

function announcementEnsureHeaders_(sheet, requiredHeaders) {
  let lastColumn = Math.max(1, sheet.getLastColumn());
  let headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(value) {
    return String(value || "").trim();
  });

  if (!headers.some(Boolean)) {
    headers = requiredHeaders.slice();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    requiredHeaders.forEach(function(header) {
      if (headers.indexOf(header) !== -1) return;
      headers.push(header);
      sheet.getRange(1, headers.length).setValue(header);
    });
  }

  const map = {};
  headers.forEach(function(header, index) {
    map[String(header || "").trim().toLowerCase()] = index + 1;
  });
  return map;
}

function announcementEventExists_(sheet, eventColumn, eventId) {
  if (!eventColumn || !eventId || sheet.getLastRow() < 2) return false;
  const finder = sheet
    .getRange(2, eventColumn, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(eventId))
    .matchEntireCell(true);
  return Boolean(finder.findNext());
}

function announcementJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
