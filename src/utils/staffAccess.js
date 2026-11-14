// Page capabilities are explicitly scoped to each teaching language.
// In older staff records, only the original Marking/Slides pages are inherited.
export const STAFF_LANGUAGES = Object.freeze(["german", "swahili"]);
export const STAFF_CAPABILITIES = Object.freeze([
  "marking", "slides", "attendance", "music", "publishMusic", "social", "publishSocial",
]);
export const STAFF_CAPABILITY_LABELS = Object.freeze({
  marking: "Marking", slides: "Teaching Slides", attendance: "Attendance",
  music: "Music Studio", publishMusic: "Publish music",
  social: "Social Media", publishSocial: "Publish to connected accounts",
});
const ROUTES = Object.freeze({
  marking: "/marking", slides: "/teaching-slides", attendance: "/attendance",
  music: "/music-studio", social: "/social-media",
});
export function normalizeStaffLanguages(languages) {
  return Array.isArray(languages)
    ? STAFF_LANGUAGES.filter(lang => languages.includes(lang))
    : [];
}
export function normalizeStaffAccess(access, languages, role = "teacher") {
  const permitted = normalizeStaffLanguages(languages);
  const provided = access && typeof access === "object" && !Array.isArray(access);
  return Object.fromEntries(STAFF_LANGUAGES.map(language => {
    const row = permitted.includes(language) && provided && access[language] && typeof access[language] === "object"
      ? access[language] : null;
    const result = Object.fromEntries(STAFF_CAPABILITIES.map(capability => [
      capability, permitted.includes(language)
        ? row ? row[capability] === true
          : !provided && (capability === "marking" || (capability === "slides" && role !== "reviewer"))
        : false,
    ]));
    if (!result.music) result.publishMusic = false;
    if (!result.social) result.publishSocial = false;
    return [language, result];
  }));
}
export function staffCan(access, languages, language, capability, role = "teacher") {
  if (!STAFF_CAPABILITIES.includes(capability) || !STAFF_LANGUAGES.includes(language)) return false;
  return normalizeStaffAccess(access, languages, role)[language][capability] === true;
}
export function staffRouteCapability(pathname = "") {
  if (pathname === "/marking") return "marking";
  if (pathname === "/teaching-slides" || pathname.startsWith("/teaching-slides/")) return "slides";
  if (pathname === "/attendance" || pathname.startsWith("/attendance/")) return "attendance";
  if (pathname === "/music-studio") return "music";
  if (pathname === "/social-media") return "social";
  return null;
}
export function workspaceLanguage(pathname = "", search = "", selected = "german") {
  if (/^\/teaching-slides\/course\/SWAHILI(?:\/|$)/i.test(pathname)) return "swahili";
  if (/^\/teaching-slides\/course\/(?:A1|A2|B1|B2|C1|C2)(?:\/|$)/i.test(pathname)) return "german";
  const requested = new URLSearchParams(search).get("language");
  return STAFF_LANGUAGES.includes(requested) ? requested : selected;
}
export function staffLandingRoute(access, languages, language = "german", role = "teacher") {
  const order = [language, ...STAFF_LANGUAGES.filter(item => item !== language)];
  for (const lang of order) for (const capability of ["marking", "slides", "attendance", "music", "social"]) {
    if (staffCan(access, languages, lang, capability, role)) {
      return ROUTES[capability] + (lang === "swahili" ? "?language=swahili" : "");
    }
  }
  return "/no-staff-access";
}
