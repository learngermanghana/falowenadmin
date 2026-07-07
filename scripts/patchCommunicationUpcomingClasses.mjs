import { readFileSync, writeFileSync } from "node:fs";

const path = "src/pages/CommunicationPage.jsx";
let source = readFileSync(path, "utf8");

const oldBlock = `function isAdvertisableClass(klass = {}) {
  const status = normalizeStatus(klass.status || klass.state || klass.workflowStatus);
  const terminalStatuses = new Set(["archived", "graduated", "inactive", "completed", "complete", "cancelled", "canceled", "ended", "closed"]);
  const inProgressStatuses = new Set(["active", "in_progress", "inprogress", "ongoing", "running", "started", "current", "live"]);

  if (terminalStatuses.has(status)) return false;
  if (inProgressStatuses.has(status) || status.includes("progress")) return false;

  const startDate = toDateInputValue(klass.startDate || klass.startsAt || klass.start || klass.date);
  if (startDate) return startDate >= new Date().toISOString().slice(0, 10);

  return ["upcoming", "planned", "scheduled", "registration_open", "enrolling", "open"].some((token) => status.includes(token));
}`;

const newBlock = `function isAdvertisableClass(klass = {}) {
  const status = normalizeStatus(klass.status || klass.state || klass.workflowStatus);
  const terminalStatuses = new Set(["archived", "graduated", "inactive", "completed", "complete", "cancelled", "canceled", "ended", "closed"]);
  const inProgressStatuses = new Set(["active", "in_progress", "inprogress", "ongoing", "running", "started", "current", "live"]);

  if (terminalStatuses.has(status)) return false;

  const startDate = toDateInputValue(klass.startDate || klass.startsAt || klass.start || klass.date);
  const today = new Date().toISOString().slice(0, 10);
  if (startDate && startDate >= today) return true;
  if (startDate && startDate < today && (inProgressStatuses.has(status) || status.includes("progress"))) return false;

  return ["upcoming", "planned", "scheduled", "registration_open", "enrolling", "open"].some((token) => status.includes(token));
}`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("if (startDate && startDate >= today) return true;")) {
  throw new Error("Could not patch CommunicationPage upcoming class filter.");
}

writeFileSync(path, source);
console.log("Communication upcoming class filter allows future A2 classes even when status is active/current.");
