// Falowen completion-pack extension for the bound Announcements + Certificates Apps Script.
// The full updated script is maintained separately in the bound spreadsheet project.
// This tracked extension documents the production contract and helper used by that script.

const COMPLETION_DOCUMENT_SECRET_PROPERTY = "COMPLETION_DOCUMENT_SECRET";
const COMPLETION_DOCUMENT_URL =
  "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/completion/attendance-participation-document";

function configureCompletionDocumentSecret() {
  const ui = getUiOrNull_();
  if (!ui) throw new Error("Open the bound spreadsheet and run this function from the menu.");

  const response = ui.prompt(
    "Save Completion Document Secret",
    "Enter the same private secret configured in Falowen as communication.completion_document_secret. Use at least 24 characters.",
    ui.ButtonSet.OK_CANCEL,
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  const secret = String(response.getResponseText() || "").trim();
  if (secret.length < 24) {
    ui.alert("Use a secret with at least 24 characters.");
    return;
  }

  PropertiesService.getScriptProperties().setProperty(COMPLETION_DOCUMENT_SECRET_PROPERTY, secret);
  ui.alert("Completion document secret saved securely in Script Properties.");
}

function fetchCompletionParticipationPdf_(student, level, completionDate) {
  const s = student || {};
  const secret = String(
    PropertiesService.getScriptProperties().getProperty(COMPLETION_DOCUMENT_SECRET_PROPERTY) || "",
  ).trim();

  if (!secret) {
    Logger.log("Completion participation PDF skipped: completion document secret is not configured.");
    return null;
  }

  const payload = {
    student_code: s.student_code || s.studentcode || "",
    studentCode: s.student_code || s.studentcode || "",
    studentName: s.name || "",
    email: s.email || "",
    class_name: s.class_name || "",
    className: s.class_name || "",
    level: String(level || "").trim().toUpperCase(),
    completion_date: completionDate ? new Date(completionDate).toISOString() : new Date().toISOString(),
  };

  try {
    const response = UrlFetchApp.fetch(COMPLETION_DOCUMENT_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "X-Falowen-Completion-Secret": secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      followRedirects: true,
    });

    const status = Number(response.getResponseCode() || 0);
    const headers = response.getAllHeaders ? response.getAllHeaders() : {};
    const contentType = String(headers["Content-Type"] || headers["content-type"] || "").toLowerCase();
    if (status < 200 || status >= 300 || contentType.indexOf("application/pdf") < 0) {
      Logger.log("Completion participation PDF unavailable: HTTP " + status);
      return null;
    }

    const safeCode = String(payload.student_code || "Student").replace(/[^A-Za-z0-9_-]+/g, "_");
    const safeLevel = String(payload.level || "Course").replace(/[^A-Za-z0-9_-]+/g, "_");
    return response.getBlob().setName(
      safeCode + "_" + safeLevel + "_Attendance_and_Class_Participation.pdf",
    );
  } catch (error) {
    Logger.log("Completion participation PDF fetch failed: " + error);
    return null;
  }
}

// In completionWatcherJob_ after certificate + transcript creation:
//
// const participationDocument = fetchCompletionParticipationPdf_(student, lvl, completionDate);
// const completionAttachments = [cert, transcript];
// if (participationDocument) completionAttachments.push(participationDocument);
// const ok = sendOrQueueEmail_(student.email, subj, html, completionAttachments);
//
// The same helper is called from buildAnnouncementMessage_ when a manually-sent
// certificate announcement is for a student whose course completion is verified.
//
// Failure is intentionally non-blocking: certificate + transcript are still sent
// when Falowen cannot produce the participation PDF.
