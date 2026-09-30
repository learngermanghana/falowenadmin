export const FALOWEN_CLASSES_BASE_URL = "https://www.falowen.app/classes/";
export const FALOWEN_REGISTRATION_URL = "https://www.falowen.app/signup";
export const FALOWEN_VISITOR_GUIDE_URL = "https://www.falowen.app/visitor-guide";

export function createBrochureEngagementRef() {
  const random = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 18)
    : Math.random().toString(36).slice(2, 14);
  return `lead_${Date.now().toString(36)}_${random}`;
}

function addAdmissionsContext(url, { slug = "", engagementRef = "", source = "brochure-message" } = {}) {
  if (slug) url.searchParams.set("class", slug);
  if (engagementRef) url.searchParams.set("ref", engagementRef);
  if (source) url.searchParams.set("source", source);
  return url;
}

export function buildVisitorGuideUrl(klass = {}, baseUrl = FALOWEN_VISITOR_GUIDE_URL, engagementRef = "") {
  const slug = brochureClassSlug(klass);
  if (!slug && !engagementRef) return baseUrl;
  const url = new URL(baseUrl);
  addAdmissionsContext(url, { slug, engagementRef });
  return url.toString();
}

export function buildRegistrationUrl(klass = {}, engagementRef = "") {
  const slug = brochureClassSlug(klass);
  const url = new URL(FALOWEN_REGISTRATION_URL);
  url.searchParams.set("program", "german");
  addAdmissionsContext(url, { slug, engagementRef });
  return url.toString();
}

export const BROCHURE_WHATSAPP_MESSAGE = `Thank you for the call. Here are the current Falowen class options.

View upcoming classes and brochures:
${FALOWEN_CLASSES_BASE_URL}

About the school & how Falowen works:
${FALOWEN_VISITOR_GUIDE_URL}

Register now:
${FALOWEN_REGISTRATION_URL}

If you have any further questions or need assistance with registration, simply reply to this message.`;

function text(value) {
  return String(value ?? "").trim();
}

export function slugifyBrochureClass(value) {
  return text(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugFromClassUrl(value) {
  const raw = text(value);
  if (!raw) return "";
  try {
    const url = new URL(raw, "https://www.falowen.app");
    const match = url.pathname.match(/^\/classes\/([^/]+)\/?$/i);
    if (match?.[1]) return slugifyBrochureClass(match[1]);
    return slugifyBrochureClass(url.searchParams.get("class") || "");
  } catch {
    return "";
  }
}

export function brochureClassSlug(klass = {}) {
  return slugifyBrochureClass(
    klass.slug
    || slugFromClassUrl(klass.classUrl || klass.registrationLink || klass.link)
    || klass.title
    || klass.name
    || klass.className
    || klass.classId
    || klass.id,
  );
}

export function buildClassBrochureUrl(klass = {}, baseUrl = FALOWEN_CLASSES_BASE_URL, engagementRef = "") {
  const slug = brochureClassSlug(klass);
  if (!slug) return "";
  const url = new URL(baseUrl);
  addAdmissionsContext(url, { slug, engagementRef });
  url.searchParams.set("open", "1");
  return url.toString();
}

function dateKey(value) {
  if (!value) return "";
  if (typeof value?.toDate === "function") return value.toDate().toISOString().slice(0, 10);
  const raw = text(value);
  const direct = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (direct) return direct[1];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function dateKeyMs(value) {
  const key = dateKey(value);
  if (!key) return 0;
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function formatBrochureDate(value) {
  const key = dateKey(value);
  if (!key) return "To be announced";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}T00:00:00Z`));
}

function formatDay(value) {
  const raw = text(value);
  if (!raw) return "";
  const names = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };
  return names[raw.slice(0, 3).toLowerCase()] || raw;
}

export function formatBrochureSchedule(klass = {}) {
  const rules = Array.isArray(klass.scheduleRules)
    ? klass.scheduleRules
    : Array.isArray(klass.meetingDays)
      ? klass.meetingDays
      : [];
  if (!rules.length) return "Schedule to be announced";

  return rules
    .map((rule) => {
      const day = formatDay(rule?.day);
      const start = text(rule?.startTime);
      const end = text(rule?.endTime);
      if (!day) return "";
      if (start && end) return `${day} ${start}–${end}`;
      if (start) return `${day} ${start}`;
      return day;
    })
    .filter(Boolean)
    .join(" · ") || "Schedule to be announced";
}

function money(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatBrochureFee(klass = {}) {
  const amount = money(
    klass.tuitionGhs
    ?? klass.tuitionFee
    ?? klass.fee
    ?? klass.price
    ?? klass.tuition,
  );
  if (!amount) return "Fee to be confirmed";
  const currency = text(klass.currency || "GHS").toUpperCase();
  return `${currency} ${amount.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
}

export function isUpcomingBrochureClass(klass = {}, now = new Date()) {
  if (!klass || klass.publicVisible === false || klass.registrationOpen === false) return false;
  if (klass.archived === true || klass.isArchived === true) return false;

  const status = text(klass.status).toLowerCase();
  if (["archived", "graduated", "inactive", "completed", "cancelled", "canceled", "draft"].includes(status)) {
    return false;
  }

  const startMs = dateKeyMs(klass.startDate || klass.startsAt);
  if (!startMs) return false;

  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return startMs >= todayMs;
}

export function upcomingBrochureClasses(classes = [], now = new Date()) {
  return (Array.isArray(classes) ? classes : [])
    .filter((klass) => isUpcomingBrochureClass(klass, now))
    .sort((left, right) => {
      const dateDifference = dateKeyMs(left.startDate || left.startsAt) - dateKeyMs(right.startDate || right.startsAt);
      if (dateDifference !== 0) return dateDifference;
      return text(left.name || left.className || left.classId)
        .localeCompare(text(right.name || right.className || right.classId));
    });
}

export function buildClassBrochureMessage(klass = {}, studentName = "", engagementRef = "") {
  const className = text(klass.title || klass.name || klass.className || klass.classId || klass.level || "Falowen class");
  const brochureUrl = buildClassBrochureUrl(klass, FALOWEN_CLASSES_BASE_URL, engagementRef);
  const visitorGuideUrl = buildVisitorGuideUrl(klass, FALOWEN_VISITOR_GUIDE_URL, engagementRef);
  const registrationUrl = buildRegistrationUrl(klass, engagementRef);
  const name = text(studentName);
  const lines = [
    name ? `Hello ${name}, thank you for the call.` : "Thank you for the call.",
    "",
    `Here are the details for *${className}*.`,
    "",
    `*Start date:* ${formatBrochureDate(klass.startDate || klass.startsAt)}`,
    `*Schedule:* ${formatBrochureSchedule(klass)}`,
    `*Course fee:* ${formatBrochureFee(klass)}`,
    "",
    "*View the class brochure:*",
    brochureUrl,
    "",
    "*About the school & how Falowen works:*",
    visitorGuideUrl,
    "",
    "*Register now:*",
    registrationUrl,
    "",
    "If you have any questions, simply reply to this message.",
  ];
  return lines.join("\n");
}

export function normalizeGhanaWhatsappNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return "";
}

export function buildBrochureWhatsappUrl(phone, message = BROCHURE_WHATSAPP_MESSAGE) {
  const normalizedPhone = normalizeGhanaWhatsappNumber(phone);
  if (!normalizedPhone || !String(message).trim()) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(String(message).trim())}`;
}
