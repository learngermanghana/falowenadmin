// Falowen completion-pack extension for the bound Announcements + Certificates Apps Script.
// Reuses the EXISTING Announcement webhook token already stored by
// "Falowen Announcements → Setup: Save Webhook Token". No second secret is required.

const COMPLETION_DOCUMENT_URL =
  "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/completion/attendance-participation-document";

function fetchCompletionParticipationPdf_(student, level, completionDate) {
  const s = student || {};
  const secret = String(getWebhookToken_() || "").trim();

  if (!secret) {
    Logger.log("Completion participation PDF skipped: existing Announcement webhook token is not configured.");
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
      headers: { "X-Falowen-Announcement-Token": secret },
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
