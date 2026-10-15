// Read-only staff directory compatibility for older student registrations.
// Field names differ between form versions and imports. Do not copy contacts
// into new Firestore documents or request them from the public student sheet.

const normalizedKey = (key) => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const blank = (value) => {
  if (value == null || typeof value === "object" || typeof value === "boolean") return "";
  const text = String(value).trim();
  return /^(?:n\/?a|none|null|undefined|not (?:provided|available)|unknown|-|—)$/i.test(text) ? "" : text;
};

function fromFields(record, aliases) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "";
  const fields = new Map(Object.entries(record).map(([key, value]) => [normalizedKey(key), value]));
  for (const alias of aliases) {
    const value = blank(fields.get(normalizedKey(alias)));
    if (value) return value;
  }
  return "";
}

const PHONE_KEYS = [
  "emergencyContactPhoneNumber", "emergencyContactPhone", "emergencyContactNumber",
  "emergencyPhone", "emergency_phone_number", "emergency_contact_phone_number",
  "emergency contact phone", "emergency contact number", "emergency number",
  "phone number in case of emergency", "nextOfKinPhone", "nextOfKinContact",
];
const NAME_KEYS = [
  "emergencyContactName", "emergencyContactPerson", "emergency contact name",
  "emergency contact person", "emergency_contact_person", "nextOfKinName",
];
const RELATIONSHIP_KEYS = [
  "emergencyContactRelationship", "emergencyContactRelation",
  "emergency contact relationship", "relationship to emergency contact",
  "nextOfKinRelationship", "guardianRelationship",
];

const FALLBACK_PHONE = ["guardianPhone", "guardianPhoneNumber", "nextOfKinPhone"];
const FALLBACK_NAME = ["guardianName", "nextOfKinName"];
const FALLBACK_RELATION = ["guardianRelationship", "nextOfKinRelationship"];

function nestedEmergency(student) {
  const candidate = student.emergencyContact || student.emergency_contact || student.emergencyContactDetails;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
}

function nameOrPhoneFromLegacyContact(student) {
  const raw = blank(student.emergencyContact || student.emergency_contact);
  if (!raw) return { name: "", phone: "" };
  return (raw.replace(/\D/g, "").length >= 7) ? { name: "", phone: raw } : { name: raw, phone: "" };
}

export function getStudentEmergencyContact(student = {}) {
  const record = student && typeof student === "object" ? student : {};
  const nested = nestedEmergency(record);
  const legacy = nameOrPhoneFromLegacyContact(record);
  const phone = fromFields(nested, ["phone", "phoneNumber", "telephone", ...PHONE_KEYS])
    || fromFields(record, PHONE_KEYS) || legacy.phone;
  const name = fromFields(nested, ["name", "fullName", "contactPerson", ...NAME_KEYS])
    || fromFields(record, NAME_KEYS) || legacy.name;
  const relationship = fromFields(nested, ["relationship", "relation", ...RELATIONSHIP_KEYS])
    || fromFields(record, RELATIONSHIP_KEYS);

  if (phone || name || relationship) return { phone, name, relationship, source: "emergency" };

  // A guardian/next of kin is not automatically a designated emergency
  // contact: label this distinctly so teachers do not mistake the two.
  const fallback = {
    phone: fromFields(record, FALLBACK_PHONE),
    name: fromFields(record, FALLBACK_NAME),
    relationship: fromFields(record, FALLBACK_RELATION),
  };
  return { ...fallback, source: fallback.phone || fallback.name || fallback.relationship ? "guardian" : "missing" };
}

export function resolveEmergencyContactPhone(student = {}) {
  return getStudentEmergencyContact(student).phone;
}

export function resolveEmergencyContactName(student = {}) {
  return getStudentEmergencyContact(student).name;
}

export function callEmergencyContactUrl(value = "") {
  const raw = blank(value);
  if (raw.replace(/\D/g, "").length < 7) return "";
  const clean = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return clean ? "tel:" + clean : "";
}
