function text(value) {
  return String(value ?? "").trim();
}

export function normalizeLeadNotificationValue(value) {
  return text(value).toLowerCase();
}

export function isResolvedLead(lead = {}) {
  const status = normalizeLeadNotificationValue(lead.status);
  const paymentStatus = normalizeLeadNotificationValue(lead.paymentStatus);
  const terminalStatuses = [
    "student_registered",
    "completed",
    "complete",
    "converted",
    "closed",
    "class_started_no_followup",
    "not_interested",
    "cancelled",
    "canceled",
    "archived",
  ];
  const paidStatuses = ["paid", "registered_paid", "success", "successful", "completed", "complete"];

  return terminalStatuses.some((token) => status.includes(token))
    || paidStatuses.includes(paymentStatus);
}

export function isNewLeadNotification(lead = {}) {
  const status = normalizeLeadNotificationValue(lead.status);
  return !status || status === "new" || status === "new_lead";
}

export function leadNotificationDate(lead = {}) {
  const parsed = new Date(lead.registrationDate || lead.createdAt || 0);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function leadNotificationIdentity(lead = {}) {
  return text(lead.id || lead.leadId || lead.email || lead.number || lead.name || "unknown-lead").toLowerCase();
}

export function leadNotificationSignature(lead = {}) {
  const trackedFields = [
    leadNotificationIdentity(lead),
    lead.name,
    lead.email,
    lead.number,
    lead.level,
    lead.className,
    lead.status,
    lead.paymentStatus,
    lead.amountPaid,
    lead.balance,
    lead.studentCode,
    lead.registrationDate,
    lead.nextFollowUpAt,
    lead.lastFollowUpAt,
    lead.source,
  ];
  return trackedFields.map((field) => text(field).toLowerCase()).join("|");
}

export function adminLeadNotificationStorageKey(admin) {
  const adminId = text(admin?.uid || admin?.email || "anonymous-admin").toLowerCase();
  return `falowen:lead-notifications:seen:${adminId}`;
}

export function readSeenLeadNotifications(admin, storage = globalThis.localStorage) {
  if (!storage) return new Set();
  try {
    const raw = storage.getItem(adminLeadNotificationStorageKey(admin));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

export function writeSeenLeadNotifications(admin, signatures, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(adminLeadNotificationStorageKey(admin), JSON.stringify([...new Set(signatures)].filter(Boolean)));
}

export function summarizeLeadNotifications(leads = [], admin, storage = globalThis.localStorage) {
  const unresolvedLeads = leads
    .filter((lead) => !isResolvedLead(lead))
    .sort((left, right) => leadNotificationDate(right) - leadNotificationDate(left));
  const seen = readSeenLeadNotifications(admin, storage);
  const unseenLeads = unresolvedLeads.filter((lead) => !seen.has(leadNotificationSignature(lead)));
  return {
    unresolvedLeads,
    unseenLeads,
    unresolvedCount: unresolvedLeads.length,
    unseenCount: unseenLeads.length,
    newUnseenCount: unseenLeads.filter(isNewLeadNotification).length,
  };
}

export function markAllLeadNotificationsSeen(admin, leads = [], storage = globalThis.localStorage) {
  const unresolvedLeads = leads.filter((lead) => !isResolvedLead(lead));
  const existing = readSeenLeadNotifications(admin, storage);
  unresolvedLeads.forEach((lead) => existing.add(leadNotificationSignature(lead)));
  writeSeenLeadNotifications(admin, existing, storage);
  return existing;
}
