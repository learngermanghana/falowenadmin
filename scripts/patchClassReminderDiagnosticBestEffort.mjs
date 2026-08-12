import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workerPath = path.join(repoRoot, "functions", "classSessionReminderEmails.js");

let workerSource = fs.readFileSync(workerPath, "utf8");

const unsafeWrite = '  await writeClassReminderState({ db, admin, klass, session, leadMin, status: "processing", recipientCount: recipients.length });';
const safeBlock = `  try {
    await writeClassReminderState({ db, admin, klass, session, leadMin, status: "processing", recipientCount: recipients.length });
  } catch (diagnosticError) {
    console.warn("class_reminder_diagnostic_write_failed", {
      classId: text(klass.id || klass.classId || klass.classRecordId),
      sessionId: text(session.id),
      leadMin,
      message: diagnosticError?.message || String(diagnosticError),
    });
  }`;

if (!workerSource.includes('class_reminder_diagnostic_write_failed')) {
  if (!workerSource.includes(unsafeWrite)) {
    throw new Error("Could not find the class reminder processing diagnostic write. Run patchClassSessionReminderEmails.mjs first.");
  }
  workerSource = workerSource.replace(unsafeWrite, safeBlock);
}

fs.writeFileSync(workerPath, workerSource);

const patched = fs.readFileSync(workerPath, "utf8");
if (!patched.includes('class_reminder_diagnostic_write_failed')) {
  throw new Error("Best-effort reminder diagnostic warning is missing.");
}
if (!patched.includes('await writeClassReminderState({ db, admin, klass, session, leadMin, status: "processing", recipientCount: recipients.length });')) {
  throw new Error("Processing diagnostic write is missing.");
}
if (!/try \{\s*await writeClassReminderState\([\s\S]*?status: "processing"[\s\S]*?\}\s*catch \(diagnosticError\)/.test(patched)) {
  throw new Error("Processing diagnostic write is not protected by best-effort error handling.");
}

console.log("Class reminder processing diagnostics are best-effort and cannot block delivery.");
