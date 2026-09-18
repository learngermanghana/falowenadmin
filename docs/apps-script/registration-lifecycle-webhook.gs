// Registration lifecycle webhook extension for the bound
// "Learn Language Education Academy - Auto Docs Sender" Apps Script.
//
// Security: reuse the SAME private webhook token already used by the Falowen
// Announcement integration. Save the same value in this Apps Script project's
// Script Properties as ANNOUNCEMENT_WEBHOOK_TOKEN.

const REGISTRATION_WEBHOOK_TOKEN_PROPERTY = "ANNOUNCEMENT_WEBHOOK_TOKEN";

function configureRegistrationWebhookToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Save Shared Falowen Webhook Token",
    "Paste the same private token used by Falowen Announcements. This does not create a second secret.",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  const token = String(response.getResponseText() || "").trim();
  if (token.length < 16) {
    ui.alert("Use the existing Falowen webhook token (at least 16 characters).");
    return;
  }

  PropertiesService.getScriptProperties().setProperty(
    REGISTRATION_WEBHOOK_TOKEN_PROPERTY,
    token
  );
  ui.alert("Shared Falowen webhook token saved.");
}

function registrationWebhookToken_() {
  return String(
    PropertiesService.getScriptProperties().getProperty(
      REGISTRATION_WEBHOOK_TOKEN_PROPERTY
    ) || ""
  ).trim();
}

function registrationJson_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function registrationWebhookAuthorized_(payload) {
  const expected = registrationWebhookToken_();
  const supplied = String((payload && payload.token) || "").trim();
  return Boolean(expected && supplied && expected === supplied);
}

function registrationLifecycleLookup_(row) {
  const data = row || {};
  return String(
    data.student_code ||
    data.studentCode ||
    data.studentcode ||
    data.email ||
    data.uid ||
    data.student_id ||
    ""
  ).trim();
}

function initializeRegistrationDateFromWebhook_(match, row) {
  if (!match) return "NOT_READY";

  const sh = match.studentSheet;
  let headers = match.studentHeaders.slice();
  LLA_ensurePolicyColumns_(sh, headers);

  headers = sh.getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(value => String(value).trim());

  const idx = indexMap_(headers);
  if (idx[LLA_COL_REG_DATE] === undefined) return "RECORDED";

  const cell = sh.getRange(match.studentRowNum, idx[LLA_COL_REG_DATE] + 1);
  if (cell.getValue()) return "ALREADY_RECORDED";

  const suppliedDate = toDate_(
    row.registration_date ||
    row.registrationDate ||
    row.event_time ||
    row.eventTime
  );

  cell.setValue(suppliedDate || new Date());
  return "RECORDED";
}

function processEnrollmentConfirmedWebhook_(match) {
  if (!match) {
    throw new Error("Student is not yet available in the registration sheet.");
  }

  const sh = match.studentSheet;
  ensureStudentHelperColumns_(sh);

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(value => String(value).trim());
  const idx = indexMap_(headers);
  validateStudentsColumns_(idx);

  const rowNum = match.studentRowNum;
  const row = sh.getRange(rowNum, 1, 1, sh.getLastColumn()).getValues()[0];
  const paidNow = num_(row[idx["Paid"]]);

  if (paidNow <= 0) {
    throw new Error("The student is present, but no payment is recorded yet.");
  }

  const key = getRowKey_(row, idx, rowNum);
  const result = sendEnrollmentPacketToStudent_(row, idx, key, rowNum);

  if (result !== "PENDING") {
    sh.getRange(rowNum, idx[COL_ENROLL_SENT] + 1).setValue("YES");
    sh.getRange(rowNum, idx[COL_LAST_PAID] + 1).setValue(paidNow);
    updateStatus_(sh, idx, rowNum, STATUS_ENROLLED);

    const balance = num_(row[idx["Balance"]]);
    if (balance === 0) {
      updateStatus_(sh, idx, rowNum, STATUS_PAID);
    }
  }

  return result;
}

function processRegistrationLifecycleEvent_(payload) {
  const type = String(
    payload.type ||
    payload.event_type ||
    payload.eventType ||
    ""
  ).trim().toLowerCase();

  if (
    type !== "registration.received" &&
    type !== "enrollment.confirmed"
  ) {
    throw new Error("Unsupported registration lifecycle event type: " + type);
  }

  const row = payload.row ||
    (Array.isArray(payload.rows) && payload.rows.length ? payload.rows[0] : {}) ||
    {};
  const lookup = registrationLifecycleLookup_(row);

  if (!lookup) {
    throw new Error("Registration lifecycle event is missing student identity.");
  }

  const match = findStudentByLookup_(lookup);

  if (type === "registration.received") {
    return initializeRegistrationDateFromWebhook_(match, row);
  }

  return processEnrollmentConfirmedWebhook_(match);
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents
      ? e.postData.contents
      : "{}";
    const payload = JSON.parse(raw || "{}");

    if (!registrationWebhookAuthorized_(payload)) {
      return registrationJson_({
        ok: false,
        error: "Unauthorized"
      });
    }

    if (
      String(payload.action || "").trim() !==
      "processRegistrationLifecycleEvent"
    ) {
      return registrationJson_({
        ok: false,
        error: "Unknown action"
      });
    }

    const result = processRegistrationLifecycleEvent_(payload);
    return registrationJson_({
      ok: true,
      action: "processRegistrationLifecycleEvent",
      event_id: String(payload.event_id || ""),
      type: String(payload.type || ""),
      result: result || "PROCESSED",
      count: 1
    });
  } catch (error) {
    console.error("registration lifecycle webhook failed", error);
    return registrationJson_({
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}
