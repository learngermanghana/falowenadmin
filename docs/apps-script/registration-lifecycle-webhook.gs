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

  if (isOrganisationFundedRow_(row, idx)) return "ORGANISATION_MANAGED";

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


// Admin Documents tab: request an already verified enrollment pack by identity.
// This action has no write access to Paid/Balance, and duplicate packets are
// blocked by the existing enrollment reference/send log.
function requestEnrollmentPackFromSheet_(payload) {
  const row = payload.row || {};
  const lookup = registrationLifecycleLookup_(row);
  if (!lookup) throw new Error("Select a student with a student code or email.");
  const match = findStudentByLookup_(lookup);
  if (!match) throw new Error("Student not found in the canonical students sheet.");
  const idx = indexMap_(match.studentHeaders);
  const registeredEmail = String(match.studentRow[idx["Email"]] || "").trim().toLowerCase();
  const requestedEmail = String(row.email || "").trim().toLowerCase();
  if (requestedEmail && requestedEmail !== registeredEmail) {
    throw new Error("Selected student code and email do not match the students sheet.");
  }
  return processEnrollmentConfirmedWebhook_(match);
}

// Same template and signature as the existing Student Docs PDFs; no email sent,
// no issuance flags written. Data is taken exclusively from the students sheet.
function exportEnrollmentDocumentFromSheet_(payload) {
  const requested = payload.row || {};
  const kind = String(payload.document_type || "").trim().toLowerCase();
  if (kind !== "enrollment" && kind !== "agreement") {
    throw new Error("Choose enrollment or agreement PDF.");
  }
  const lookup = registrationLifecycleLookup_(requested);
  if (!lookup) throw new Error("Select a student code or email.");
  const match = findStudentByLookup_(lookup);
  if (!match) throw new Error("Student not found in the canonical students sheet.");
  const idx = indexMap_(match.studentHeaders);
  const row = match.studentRow;
  const email = String(row[idx["Email"]] || "").trim().toLowerCase();
  const code = String(row[idx["StudentCode"]] || "").trim().toLowerCase();
  if (requested.email && String(requested.email).trim().toLowerCase() !== email) {
    throw new Error("Student code and email do not match the students sheet.");
  }
  if (requested.student_code && String(requested.student_code).trim().toLowerCase() !== code) {
    throw new Error("Student code and email do not match the students sheet.");
  }
  if (num_(row[idx["Paid"]]) <= 0) {
    throw new Error("No recorded payment. A verified enrollment PDF cannot be exported.");
  }
  if (isOrganisationFundedRow_(row, idx)) {
    throw new Error("Organisation-funded enrollment documents must use the organisation workflow.");
  }
  const key = getRowKey_(row, idx, match.studentRowNum);
  const blob = kind === "enrollment"
    ? buildEnrollmentPdf_(row, idx, key)
    : buildAgreementPdf_(row, idx, key);
  const bytes = blob.getBytes();
  if (bytes.length > 2750000) throw new Error("PDF is too large for direct export.");
  return {
    file_name: blob.getName(),
    mime_type: "application/pdf",
    data_base64: Utilities.base64Encode(bytes),
  };
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

    const action = String(payload.action || "").trim();
    if (action !== "processRegistrationLifecycleEvent" &&
        action !== "requestEnrollmentPackFromSheet" &&
        action !== "exportEnrollmentDocumentFromSheet") {
      return registrationJson_({ ok: false, error: "Unknown action" });
    }

    // A manual Admin request never accepts Paid, Balance, or Status values
    // from the browser. Only the canonical students sheet authorizes a pack.
    // Reuse the same script lock as the timer-driven Student Docs scanner.
    // A concurrent on-edit/scan/webhook must not issue two enrollment packs.
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) throw new Error("Student Docs worker is busy; retry later.");
    let result;
    try {
      result = action === "requestEnrollmentPackFromSheet"
        ? requestEnrollmentPackFromSheet_(payload)
        : action === "exportEnrollmentDocumentFromSheet"
          ? exportEnrollmentDocumentFromSheet_(payload)
          : processRegistrationLifecycleEvent_(payload);
    } finally {
      lock.releaseLock();
    }
    if (action === "exportEnrollmentDocumentFromSheet") {
      return registrationJson_({ ok: true, action, result: "EXPORTED", ...result });
    }
    return registrationJson_({
      ok: true,
      action,
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
