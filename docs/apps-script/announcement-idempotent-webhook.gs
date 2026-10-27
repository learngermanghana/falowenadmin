/**
 * Falowen Announcement webhook with event-level idempotency.
 *
 * Add this as the deployed Apps Script Web App behind ANNOUNCEMENT_WEBHOOK_URL.
 * It keeps the existing announcement columns and adds event_id when needed.
 *
 * Required Script Property (optional):
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
    if (configuredToken && String(body.token || "") !== configuredToken) {
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
      "event_id",
    ]);

    if (eventId && announcementEventExists_(sheet, headerMap.event_id, eventId)) {
      return announcementJson_({
        ok: true,
        count: 0,
        duplicate: true,
        event_id: eventId,
      });
    }

    let inserted = 0;
    rows.forEach(function(row) {
      const rowEventId = String(row.event_id || row.idempotency_key || eventId || "").trim();

      // A batch may contain repeated rows with the same stable event. Skip any
      // event that is already present, including one inserted earlier in this batch.
      if (rowEventId && announcementEventExists_(sheet, headerMap.event_id, rowEventId)) {
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

      sheet.appendRow(values);
      inserted += 1;
    });

    return announcementJson_({
      ok: true,
      count: inserted,
      duplicate: inserted === 0 && Boolean(eventId),
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
  return spreadsheet.getActiveSheet();
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
