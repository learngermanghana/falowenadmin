// Client-only class campaign builder. All content derives from the selected class record.
export const CAMPAIGN_FORMATS = Object.freeze({
  square: { id: "square", width: 1080, height: 1080, label: "Square" },
  portrait: { id: "portrait", width: 1080, height: 1350, label: "Portrait" },
  story: { id: "story", width: 1080, height: 1920, label: "Story / WhatsApp Status" },
});

function normalized(value) {
  return String(value ?? "").trim();
}
function dateKey(raw) {
  const value = normalized(raw);
  const matched = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
  if (!matched) return "";
  const timestamp = Date.parse(matched[1] + "T00:00:00Z");
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === matched[1]
    ? matched[1] : "";
}
export function accraToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const pick = (type) => parts.find((part) => part.type === type)?.value;
  return [pick("year"), pick("month"), pick("day")].join("-");
}
export function daysUntilClass(value, today = accraToday()) {
  const date = dateKey(value);
  const day = dateKey(today);
  if (!date || !day) return null;
  return Math.round((Date.parse(date + "T00:00:00Z") - Date.parse(day + "T00:00:00Z")) / 86400000);
}
export function campaignClassEligibility(klass = {}, today = accraToday()) {
  const status = normalized(klass.status).toLowerCase();
  if (klass.publicVisible === false || klass.archived === true || klass.isArchived === true) return false;
  if (klass.registrationOpen === false) return false;
  if (["archived", "cancelled", "canceled", "graduated", "completed", "inactive", "draft"].includes(status)) return false;
  const days = daysUntilClass(klass.startDate, today);
  if (["active", "ongoing"].includes(status)) {
    // No late-enrollment advertising without an explicit, authoritative open flag.
    if (klass.registrationOpen !== true) return false;
    const end = dateKey(klass.endDate);
    return Boolean(end && end >= today);
  }
  // Future class with registration not explicitly closed: preserves legacy class records.
  return (status === "upcoming" || status === "scheduled" || !status) && days !== null && days >= 0;
}
export function isSafeCampaignUrl(value) {
  try {
    const url = new URL(normalized(value));
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
function headingForCountdown(days, active) {
  if (active) return "JOIN AN ONGOING CLASS";
  if (days === 0) return "CLASS STARTS TODAY";
  if (days === 1) return "STARTS TOMORROW";
  if (days !== null && days > 1 && days <= 14) return "STARTS IN " + days + " DAYS";
  return "NEXT GERMAN CLASS";
}
export function createClassCampaign(klass = {}, base = {}, today = accraToday()) {
  const days = daysUntilClass(klass.startDate, today);
  const active = ["active", "ongoing"].includes(normalized(klass.status).toLowerCase());
  const group = {
    registration: { id: "registration", label: "Registration open", format: "portrait" },
    overview: { id: "overview", label: "Class details · 1 of 2", format: "square" },
    logistics: { id: "logistics", label: "Class details · 2 of 2", format: "square" },
    countdown: { id: "countdown", label: "Class countdown", format: "story" },
    whatsapp: { id: "whatsapp", label: "WhatsApp status", format: "story" },
  };
  const baseData = { ...base };
  const slides = [
    {
      ...group.registration,
      data: { ...baseData, eyebrow: active ? "ENROLMENT OPEN" : "REGISTRATION OPEN", highlight: "", cta: "REGISTER NOW" },
    },
    {
      ...group.overview,
      data: { ...baseData, eyebrow: "CLASS DETAILS · 1/2", fee: "", duration: "", highlight: "", cta: "SWIPE FOR MORE" },
    },
    {
      ...group.logistics,
      data: { ...baseData, eyebrow: "CLASS DETAILS · 2/2", startDate: "", schedule: "", highlight: "Registration and contact information", cta: "REGISTER NOW" },
    },
    {
      ...group.countdown,
      label: active ? "Join this class" : (days !== null && days <= 14 ? "Starts soon" : "Starting date"),
      data: {
        ...baseData, eyebrow: headingForCountdown(days, active),
        highlight: active ? "Registration is open for this ongoing class." : "Prepare for your next step in German.",
        schedule: "", fee: "", duration: "", cta: "ENROL TODAY",
      },
    },
    {
      ...group.whatsapp,
      data: { ...baseData, eyebrow: "LEARN GERMAN WITH FALOWEN", highlight: "Join our German classes.", duration: "", cta: "REGISTER NOW" },
    },
  ];
  return slides.map((slide) => ({
    ...slide,
    filename: slide.id + "-" + slide.format + ".png",
    caption: classCampaignCaption(klass, slide.data, slide.id, today),
  }));
}
export function classCampaignCaption(klass = {}, data = {}, campaignId = "registration", today = accraToday()) {
  const active = ["active", "ongoing"].includes(normalized(klass.status).toLowerCase());
  const days = daysUntilClass(klass.startDate, today);
  const starts = !active && days !== null && days >= 0
    ? days === 0 ? "Classes start today." : days === 1 ? "Classes start tomorrow." : days <= 14 ? "Starts in " + days + " days." : ""
    : "";
  const lead = {
    registration: "German class registration is open!",
    overview: "Explore our German class schedule.",
    logistics: "Find the right German class for you.",
    countdown: active ? "Registration is open for this ongoing class." : starts || "Prepare for your next German class.",
    whatsapp: "Learn German with Falowen.",
  }[campaignId] || "Learn German with Falowen.";
  return [
    lead, normalized(data.className),
    data.startDate && !active ? "Start: " + normalized(data.startDate) : "",
    data.schedule ? "Schedule: " + normalized(data.schedule) : "",
    data.mode ? "Mode: " + normalized(data.mode) : "",
    data.fee ? "Fee: " + normalized(data.fee) : "",
    data.website && isSafeCampaignUrl(data.website) ? "Register: " + normalized(data.website) : "",
    data.phone ? "Contact: " + normalized(data.phone) : "",
    "#Falowen #LearnGerman #GermanInGhana",
  ].filter(Boolean).join("\n");
}
export function classCampaignManifest(klass = {}, slides = []) {
  return [
    "FALOWEN CLASS CAMPAIGN",
    "Class: " + normalized(klass.name || klass.className || klass.id),
    "Review class schedule, price, contact details and registration URL before publishing.",
    "Carousel order: overview (1/2), logistics (2/2).",
    "The countdown is based on today's Accra date. Regenerate just before posting.",
    "An ongoing class must have registrationOpen=true and an end date in the future.",
    "Never claim limited seats without verified capacity.",
    "",
    ...slides.flatMap((slide) => [slide.filename, slide.caption, ""]),
  ].join("\n");
}
// Small standards-compliant uncompressed ZIP archive for in-browser PNG/caption exports.
// No server upload or new package dependency.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(n) { return Uint8Array.of(n & 255, (n >>> 8) & 255); }
function u32(n) { return Uint8Array.of(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255); }
function flatten(parts) {
  const total = parts.reduce((count, part) => count + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
export function makeCampaignZip(files = []) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const filename = normalized(file.name);
    if (!filename || filename.includes("/") || filename.includes("\\") || files.length > 100) throw new Error("Invalid campaign filename.");
    const name = encoder.encode(filename);
    const bytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    if (!(bytes instanceof Uint8Array) || bytes.byteLength > 25_000_000) throw new Error("Invalid campaign file.");
    const crc = crc32(bytes);
    const size = bytes.byteLength;
    const local = flatten([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size),
      u16(name.length), u16(0), name, bytes,
    ]);
    const central = flatten([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0),
      u16(0), u32(0), u32(offset), name,
    ]);
    localParts.push(local);
    centralParts.push(central);
    offset += local.length;
  }
  const centralOffset = offset;
  const directory = flatten(centralParts);
  return new Blob([
    ...localParts, directory,
    flatten([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(directory.length), u32(centralOffset), u16(0)]),
  ], { type: "application/zip" });
}
