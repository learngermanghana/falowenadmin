// Falowen score-sheet webhook.
// Replace the old append-only doPost handler with this file, preserve your token,
// and deploy a new Apps Script web-app version.

const SCORE_WEBHOOK_TOKEN = "REPLACE_WITH_YOUR_EXISTING_TOKEN"; // Use "" only when token checking is intentionally disabled.

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizedHeader_(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizedStudentCode_(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function canonicalAssignmentId_(value) {
  const source = String(value || "").trim();
  const match = source.match(/([A-Z]\d+)\s*[-_.]\s*(\d+(?:[._]\d+)*)/i);
  if (match) return match[1].toUpperCase() + "-" + match[2].replace(/_/g, ".");
  return source.toUpperCase().replace(/\s+/g, " ");
}

function normalizedAttemptSuffix_(parts) {
  if (!parts || parts.length < 3) return "";
  return parts.slice(2).join("__").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function cellValue_(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value || "");
  }
}

function selectSheet_(spreadsheet, body) {
  if (body.sheet_gid) {
    return spreadsheet.getSheets().find(function (sheet) {
      return String(sheet.getSheetId()) === String(body.sheet_gid);
    }) || null;
  }
  if (body.sheet_name) return spreadsheet.getSheetByName(String(body.sheet_name));
  return spreadsheet.getActiveSheet();
}

function readHeaders_(sheet) {
  const lastColumn = Math.max(1, sheet.getLastColumn());
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return String(value || "").trim();
  });
}

function ensureHeaders_(sheet, rows) {
  const headers = readHeaders_(sheet);
  const existing = {};
  headers.forEach(function (header, index) {
    if (header) existing[normalizedHeader_(header)] = index;
  });

  const preferred = [
    "studentcode", "name", "assignment", "score", "comments", "date", "level", "link",
    "assignment_id", "dedupe_id", "source",
  ];
  const requested = preferred.concat(rows.reduce(function (keys, row) {
    return keys.concat(Object.keys(row || {}));
  }, []));

  requested.forEach(function (key) {
    const normalized = normalizedHeader_(key);
    if (!normalized || Object.prototype.hasOwnProperty.call(existing, normalized)) return;
    headers.push(key);
    existing[normalized] = headers.length - 1;
  });

  if (headers.length > sheet.getMaxColumns()) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return headers;
}

function objectFromRow_(headers, values) {
  const result = {};
  headers.forEach(function (header, index) {
    result[normalizedHeader_(header)] = values[index];
  });
  return result;
}

function firstValue_(row, aliases) {
  for (let index = 0; index < aliases.length; index += 1) {
    const value = row[normalizedHeader_(aliases[index])];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function resultKeyFromObject_(row) {
  const explicit = firstValue_(row, ["dedupe_id", "dedupeId"]);
  if (explicit) {
    const parts = String(explicit).trim().split("__");
    if (parts.length >= 2) {
      const studentCode = normalizedStudentCode_(parts[0]);
      const assignmentId = canonicalAssignmentId_(parts[1]);
      const suffix = normalizedAttemptSuffix_(parts);
      if (studentCode && assignmentId) {
        return studentCode + "__" + assignmentId + (suffix ? "__" + suffix : "");
      }
    }
  }

  const studentCode = normalizedStudentCode_(firstValue_(row, ["studentcode", "studentCode", "student_id", "uid"]));
  const assignmentId = canonicalAssignmentId_(firstValue_(row, ["assignment_id", "assignmentId", "assignmentKey", "assignment"]));
  return studentCode && assignmentId ? studentCode + "__" + assignmentId : "";
}

function incomingAsNormalizedObject_(row) {
  const result = {};
  Object.keys(row || {}).forEach(function (key) {
    result[normalizedHeader_(key)] = row[key];
  });
  return result;
}

function mergedValues_(headers, currentValues, incoming) {
  const normalizedIncoming = incomingAsNormalizedObject_(incoming);
  return headers.map(function (header, index) {
    const key = normalizedHeader_(header);
    if (Object.prototype.hasOwnProperty.call(normalizedIncoming, key)) return cellValue_(normalizedIncoming[key]);
    return currentValues ? currentValues[index] : "";
  });
}

function findMatchingRows_(sheet, headers, key) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const matches = [];
  values.forEach(function (rowValues, index) {
    const object = objectFromRow_(headers, rowValues);
    if (resultKeyFromObject_(object) === key) {
      matches.push({ rowNumber: index + 2, values: rowValues });
    }
  });
  return matches;
}

function upsertScoreRows_(sheet, rows) {
  const headers = ensureHeaders_(sheet, rows);
  let inserted = 0;
  let updated = 0;
  let duplicatesRemoved = 0;

  const latestIncomingByKey = {};
  rows.forEach(function (row) {
    const normalized = incomingAsNormalizedObject_(row);
    const key = resultKeyFromObject_(normalized);
    if (!key) throw new Error("Every score row needs a student code and assignment ID.");
    normalized.dedupeid = key;
    normalized.studentcode = normalizedStudentCode_(firstValue_(normalized, ["studentcode", "studentCode"]));
    normalized.assignmentid = canonicalAssignmentId_(firstValue_(normalized, ["assignment_id", "assignmentId", "assignmentKey", "assignment"]));
    latestIncomingByKey[key] = normalized;
  });

  Object.keys(latestIncomingByKey).forEach(function (key) {
    const incoming = latestIncomingByKey[key];
    const matches = findMatchingRows_(sheet, headers, key);

    if (!matches.length) {
      sheet.appendRow(mergedValues_(headers, null, incoming));
      inserted += 1;
      return;
    }

    // Keep the newest existing position, write the incoming result there, then
    // remove every older row with the same dedupe identity.
    const target = matches[matches.length - 1];
    sheet.getRange(target.rowNumber, 1, 1, headers.length).setValues([
      mergedValues_(headers, target.values, incoming),
    ]);
    updated += 1;

    matches
      .slice(0, -1)
      .map(function (match) { return match.rowNumber; })
      .sort(function (left, right) { return right - left; })
      .forEach(function (rowNumber) {
        sheet.deleteRow(rowNumber);
        duplicatesRemoved += 1;
      });
  });

  return {
    ok: true,
    action: "upsertScoreRows",
    mode: "upsert",
    inserted: inserted,
    updated: updated,
    duplicatesRemoved: duplicatesRemoved,
  };
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (SCORE_WEBHOOK_TOKEN && body.token !== SCORE_WEBHOOK_TOKEN) {
      return json_({ ok: false, error: "Unauthorized" });
    }
    // Existing Marking-page saves may not yet send an action. Treat a missing
    // action as upsert for backward compatibility, but reject unknown actions.
    if (body.action && body.action !== "upsertScoreRows" && body.mode !== "upsert") {
      return json_({ ok: false, error: "Unsupported score webhook action" });
    }

    const rows = Array.isArray(body.rows) ? body.rows : (body.row ? [body.row] : []);
    if (!rows.length) return json_({ ok: false, error: "No score rows supplied" });

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = selectSheet_(spreadsheet, body);
    if (!sheet) return json_({ ok: false, error: "Target sheet not found" });

    return json_(upsertScoreRows_(sheet, rows));
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    try { lock.releaseLock(); } catch (error) { /* lock was not acquired */ }
  }
}
