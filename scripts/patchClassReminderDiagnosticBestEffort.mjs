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

if (!workerSource.includes('class_reminder_success_diagnostic_write_failed')) {
  const successDiagnosticPattern = /    await db\.collection\("classes"\)\.doc\(klass\.id\)\.set\(\{\n      classReminderEmailLastRunAt: timestamp,\n      classReminderEmailLastSentAt: timestamp,\n      classReminderEmailLastStatus: "sent",[\s\S]*?\n    \}, \{ merge: true \}\);/;
  const successDiagnosticMatch = workerSource.match(successDiagnosticPattern);
  if (!successDiagnosticMatch) {
    throw new Error("Could not find the post-send class reminder success diagnostic write.");
  }
  const successDiagnosticWrite = successDiagnosticMatch[0].replace(/^    /gm, "      ");
  const safeSuccessDiagnosticBlock = `    try {\n${successDiagnosticWrite}\n    } catch (diagnosticError) {\n      console.warn("class_reminder_success_diagnostic_write_failed", {\n        classId: text(klass.id || klass.classId || klass.classRecordId),\n        sessionId: text(session.id),\n        leadMin,\n        message: diagnosticError?.message || String(diagnosticError),\n      });\n    }`;
  workerSource = workerSource.replace(successDiagnosticMatch[0], safeSuccessDiagnosticBlock);
}

fs.writeFileSync(workerPath, workerSource);

const patched = fs.readFileSync(workerPath, "utf8");
if (!patched.includes('class_reminder_diagnostic_write_failed')) {
  throw new Error("Best-effort reminder processing diagnostic warning is missing.");
}
if (!patched.includes('class_reminder_success_diagnostic_write_failed')) {
  throw new Error("Best-effort reminder success diagnostic warning is missing.");
}
if (!patched.includes('await writeClassReminderState({ db, admin, klass, session, leadMin, status: "processing", recipientCount: recipients.length });')) {
  throw new Error("Processing diagnostic write is missing.");
}
if (!/try \{\s*await writeClassReminderState\([\s\S]*?status: "processing"[\s\S]*?\}\s*catch \(diagnosticError\)/.test(patched)) {
  throw new Error("Processing diagnostic write is not protected by best-effort error handling.");
}
if (!/status: "sent",[\s\S]*?lastError: "",[\s\S]*?\}, \{ merge: true \}\);\s*try \{[\s\S]*?classReminderEmailLastStatus: "sent"[\s\S]*?catch \(diagnosticError\) \{\s*console\.warn\("class_reminder_success_diagnostic_write_failed"/.test(patched)) {
  throw new Error("Post-send success diagnostic is not best-effort after the send reservation is marked sent.");
}

console.log("Class reminder processing and post-send success diagnostics are best-effort and cannot block or duplicate delivery.");
