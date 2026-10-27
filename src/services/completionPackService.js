import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { saveAnnouncementRow } from "./communicationService.js";

const REPORT_URL = "/api/completion-pack/report";
const PDF_URL = "/api/completion-pack/pdf";

function clean(value) {
  return String(value ?? "").trim();
}

function resolveStudentCode(student = {}, draft = {}) {
  return clean(draft.studentCode || student.studentCode || student.studentcode || student.student_code || student.id);
}

function resolveLevel(student = {}, draft = {}) {
  const direct = clean(draft.level || student.level || student.levelId || student.program);
  const match = direct.match(/\b(A1|A2|B1|B2|C1|C2)\b/i)
    || clean(draft.className || student.className).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
  return match?.[1]?.toUpperCase() || direct.toUpperCase();
}

function resolveCompletionDate(student = {}, draft = {}) {
  return clean(
    draft.completionDate
      || student.courseCompletedAt
      || student.completedAt
      || student.completionDate
      || student.graduationDate
      || "",
  );
}

export function completionPackPayload(student = {}, draft = {}) {
  return {
    studentId: clean(student.id),
    student_code: resolveStudentCode(student, draft),
    studentCode: resolveStudentCode(student, draft),
    studentName: clean(draft.name || student.name || student.displayName),
    email: clean(draft.email || student.email),
    class_name: clean(draft.className || student.className || student.class || student.groupName),
    className: clean(draft.className || student.className || student.class || student.groupName),
    level: resolveLevel(student, draft),
    ...(resolveCompletionDate(student, draft) ? { completion_date: resolveCompletionDate(student, draft) } : {}),
  };
}

async function authHeaders() {
  const user = auth?.currentUser;
  if (!user) throw new Error("You must be signed in to manage completion documents.");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseError(response, fallback) {
  const type = String(response.headers.get("content-type") || "").toLowerCase();
  if (type.includes("application/json")) {
    const body = await response.json().catch(() => ({}));
    return body?.error || body?.message || fallback;
  }
  const text = await response.text().catch(() => "");
  return text || fallback;
}

export async function loadCompletionPackReport(student, draft = {}) {
  const response = await fetch(REPORT_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(completionPackPayload(student, draft)),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Could not load the completion pack report."));
  }
  const body = await response.json();
  if (!body?.ok || !body?.report) throw new Error(body?.error || "Completion pack report is unavailable.");
  return body.report;
}

export async function generateCompletionPackPdf(student, draft = {}, { download = false } = {}) {
  const response = await fetch(PDF_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      ...completionPackPayload(student, draft),
      download: Boolean(download),
    }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Could not generate the Attendance & Class Participation PDF."));
  }
  const blob = await response.blob();
  const disposition = String(response.headers.get("content-disposition") || "");
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: match?.[1] || "Attendance_and_Class_Participation.pdf",
    documentId: response.headers.get("x-falowen-document-id") || "",
  };
}

export function releaseCompletionPackPdf(result) {
  if (result?.url) URL.revokeObjectURL(result.url);
}

function createdAtMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value === "object" && Number.isFinite(value.seconds)) return Number(value.seconds) * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function isCompletionHistory(row = {}) {
  const topic = clean(row.topic).toLowerCase();
  const attached = clean(row.attach_certificate).toUpperCase() === "TRUE";
  return attached || topic.includes("course completion") || topic.includes("certificate");
}

export async function loadCompletionDeliveryStatus(student = {}, draft = {}) {
  const email = clean(draft.email || student.email);
  if (!email) return null;

  const snapshot = await getDocs(query(collection(db, "announcements"), where("email", "==", email)));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(isCompletionHistory)
    .sort((left, right) => createdAtMs(right.createdAt) - createdAtMs(left.createdAt))[0] || null;
}

export async function resendCompletionPack(student = {}, draft = {}) {
  const payload = completionPackPayload(student, draft);
  if (!payload.email) throw new Error("This student has no email address.");
  if (!payload.level) throw new Error("Set the student's course level before resending the completion pack.");

  return saveAnnouncementRow({
    topic: "Course Completion",
    announcement: "Congratulations! Your course has ended. Your transcript/certificate is ready.",
    className: payload.className,
    classId: clean(student.classId || student.classRecordId),
    email: payload.email,
    studentId: clean(student.id),
    studentCode: payload.studentCode,
    studentName: payload.studentName,
    level: payload.level,
    certLevel: payload.level,
    attachCertificate: true,
    deliveryMode: "individual",
    skipDuplicateGuard: true,
  });
}
