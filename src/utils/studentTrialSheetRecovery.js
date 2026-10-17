// Staff-only directory fallback for retained trials that are still on the
// published master sheet but missing from Firestore. Never auto-reactivate.
const DAY_MS = 24 * 60 * 60 * 1000;
const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase();
const field = (row, ...names) => {
  const normalized = Object.fromEntries(Object.entries(row || {}).map(([name, value]) => [name.toLowerCase().replace(/[^a-z0-9]/g, ""), value]));
  for (const name of names) {
    const value = clean(normalized[name.toLowerCase().replace(/[^a-z0-9]/g, "")]);
    if (value) return value;
  }
  return "";
};
const timestamp = (value) => {
  const time = Date.parse(clean(value));
  return Number.isFinite(time) ? time : 0;
};

export function mapRetainedSheetTrial(row = {}, nowMs = Date.now()) {
  const status = key(field(row, "status"));
  const trialStatus = key(field(row, "trialStatus", "trial_status"));
  if (!["expired", "trial_expired", "trial expired"].includes(trialStatus)
    && !["trial_expired", "trial expired"].includes(status)) return null;
  const paymentStatus = key(field(row, "paymentStatus", "payment_status"));
  if (["paid", "partially paid", "partial", "completed", "successful"].includes(paymentStatus)) return null;
  const paid = Number(field(row, "paid", "paidAmount", "amountPaid").replace(/,/g, "") || 0);
  if (paid > 0) return null;

  const uid = field(row, "uid", "authUid", "firebaseUid");
  const studentCode = field(row, "studentCode", "student_code");
  const name = field(row, "name", "studentName", "fullName");
  const email = key(field(row, "email", "e-mail", "emailaddress"));
  if (!uid || !studentCode || !name || !email) return null;

  const registered = timestamp(field(row, "registrationDate", "registeredAt", "createdAt", "enrollDate", "joined_at"));
  const expired = timestamp(field(row, "trialExpiredAt", "trialEnd", "trialEndsAt"))
    || (registered ? registered + 7 * DAY_MS : 0);
  if (!expired || expired > nowMs) return null;
  const explicitPurgeAt = timestamp(field(row, "trialPurgeAt", "purgeAt"));
  const purgeAt = Math.max(expired + 30 * DAY_MS, explicitPurgeAt);
  if (nowMs >= purgeAt) return null;

  return {
    id: `sheet-only:${uid}`,
    sheetOnly: true,
    name,
    email,
    uid,
    studentCode,
    level: field(row, "level"),
    className: field(row, "className", "classname"),
    phone: field(row, "phone", "phonenumber", "contact"),
    location: field(row, "location"),
    learningMode: field(row, "learningMode", "mode"),
    registrationDate: registered ? new Date(registered).toISOString() : new Date(expired - 7 * DAY_MS).toISOString(),
    trialExpiredAt: new Date(expired).toISOString(),
    trialPurgeAt: new Date(purgeAt).toISOString(),
    status: "trial_expired",
    trialStatus: "expired",
    paymentStatus: "pending",
  };
}

export function missingRetainedSheetTrials(sheetRows = [], firestoreStudents = [], nowMs = Date.now()) {
  const identities = new Set();
  for (const row of firestoreStudents) {
    for (const value of [row.uid, row.authUid, row.id, row.studentCode, row.studentcode, row.email]) {
      if (key(value)) identities.add(key(value));
    }
  }
  const seen = new Set();
  return sheetRows.map((row) => mapRetainedSheetTrial(row, nowMs)).filter((row) => {
    if (!row) return false;
    const identifiers = [row.uid, row.studentCode, row.email].map(key);
    if (identifiers.some((value) => identities.has(value) || seen.has(value))) return false;
    identifiers.forEach((value) => seen.add(value));
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}
