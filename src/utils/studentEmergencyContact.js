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
  "phone number in case of emergency",
];
const NAME_KEYS = [
  "emergencyContactName", "emergencyContactPerson", "emergency contact name",
  "emergency contact person", "emergency_contact_person",
];
const RELATIONSHIP_KEYS = [
  "emergencyContactRelationship", "emergencyContactRelation",
  "emergency contact relationship", "relationship to emergency contact",

];

function nestedEmergency(student) {
  const candidate = student.emergencyContact || student.emergency_contact || student.emergencyContactDetails;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
}

function nameOrPhoneFromLegacyContact(student) {
  const raw = blank(student.emergencyContact || student.emergency_contact);
  if (!raw) return { name: "", phone: "" };
  return (raw.replace(/\D/g, "").length >= 7) ? { name: "", phone: raw } : { name: raw, phone: "" };
}

// These are the canonical student profile values, including optional legacy metadata. Presence of
// any canonical field marks the top-level contact as authoritative, including
// intentional empty strings. Never revive an obsolete nested phone after an edit.
const EDITABLE_CONTACT_FIELDS = [
  "emergencyContactName", "emergencyContactPhoneNumber", "emergencyContactRelationship",
];

export function getStudentEmergencyContact(student = {}) {
  const record = student && typeof student === "object" ? student : {};
  const canonicalExists = EDITABLE_CONTACT_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(record, field));

  if (canonicalExists) {
    const contact = {
      name: blank(record.emergencyContactName),
      phone: blank(record.emergencyContactPhoneNumber),
      relationship: blank(record.emergencyContactRelationship),
    };
    return { ...contact, source: contact.name || contact.phone || contact.relationship ? "emergency" : "missing" };
  }

  // Older records may contain top-level aliases or nested objects. Read one
  // coherent source at a time; never combine different people's details.
  const direct = {
    phone: fromFields(record, PHONE_KEYS),
    name: fromFields(record, NAME_KEYS),
    relationship: fromFields(record, RELATIONSHIP_KEYS),
  };
  if (direct.phone || direct.name || direct.relationship) return { ...direct, source: "emergency" };

  const nested = nestedEmergency(record);
  const nestedContact = {
    phone: fromFields(nested, ["phone", "phoneNumber", "telephone", ...PHONE_KEYS]),
    name: fromFields(nested, ["name", "fullName", "contactPerson", ...NAME_KEYS]),
    relationship: fromFields(nested, ["relationship", "relation", ...RELATIONSHIP_KEYS]),
  };
  if (nestedContact.phone || nestedContact.name || nestedContact.relationship)
    return { ...nestedContact, source: "emergency" };

  const legacy = nameOrPhoneFromLegacyContact(record);
  if (legacy.phone || legacy.name) return { ...legacy, relationship: "", source: "emergency" };

  // A guardian/next of kin is not automatically a designated emergency
  // contact: label this distinctly so teachers do not mistake the two.
  const guardian = {
    phone: fromFields(record, ["guardianPhone", "guardianPhoneNumber"]),
    name: fromFields(record, ["guardianName"]),
    relationship: fromFields(record, ["guardianRelationship"]),
  };
  const nextOfKin = {
    phone: fromFields(record, ["nextOfKinPhone", "nextOfKinContact"]),
    name: fromFields(record, ["nextOfKinName"]),
    relationship: fromFields(record, ["nextOfKinRelationship"]),
  };
  const populated = (entry) => entry.phone || entry.name || entry.relationship;
  if (!populated(guardian) && !populated(nextOfKin)) {
    return { phone: "", name: "", relationship: "", source: "missing" };
  }
  const useGuardian = Boolean((guardian.phone || !nextOfKin.phone) && populated(guardian));
  return { ...(useGuardian ? guardian : nextOfKin), source: useGuardian ? "guardian" : "nextOfKin" };
}

// Fill the editable form from older saved emergency-contact shapes. Guardian
// fallback remains read-only and is not silently converted into a contact.
export function emergencyContactEditorValues(student = {}) {
  const contact = getStudentEmergencyContact(student);
  return {
    emergencyContactName: contact.source === "emergency" ? contact.name : "",
    emergencyContactPhoneNumber: contact.source === "emergency" ? contact.phone : "",
    emergencyContactRelationship: contact.source === "emergency" ? contact.relationship : "",
  };
}

// Once an available emergency field changes, persist the whole contact. This makes
// replacements and deliberate clears authoritative even for nested legacy rows.
export function emergencyContactEditedFields(student = {}, draft = {}) {
  const original = emergencyContactEditorValues(student);
  // Some forms (including public signup) collect only the emergency phone.
  // Unprovided fields are not edits: keep existing legacy name/relationship,
  // rather than accidentally clearing them when staff changes the number.
  const supplied = EDITABLE_CONTACT_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(draft, field));
  if (!supplied.some((field) =>
    String(draft[field] ?? "").trim() !== original[field])) return {};
  return Object.fromEntries(EDITABLE_CONTACT_FIELDS.map((field) => [
    field,
    Object.prototype.hasOwnProperty.call(draft, field)
      ? String(draft[field] ?? "").trim() : original[field],
  ]));
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
