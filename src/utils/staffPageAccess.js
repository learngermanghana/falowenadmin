export const STAFF_PAGES = Object.freeze([
  { id: "marking", label: "Marking", path: "/marking" },
  { id: "teaching-slides", label: "Teaching Slides", path: "/teaching-slides" },
  { id: "attendance", label: "Attendance", path: "/attendance" },
  { id: "students", label: "Students", path: "/students" },
  { id: "leads", label: "Leads", path: "/leads" },
  { id: "results", label: "Results", path: "/student-results" },
  { id: "music-studio", label: "Music Studio", path: "/music-studio" },
  { id: "music-analytics", label: "Music Analytics", path: "/music-analytics" },
  { id: "shared-dictionary", label: "Shared Notes", path: "/shared-dictionary" },
]);

export function staffPageIds(value, role) {
  if (Array.isArray(value)) {
    return STAFF_PAGES.map(page => page.id).filter(id => value.includes(id));
  }
  if (role === "teacher") return ["marking", "teaching-slides", "attendance"];
  if (role === "reviewer") return ["marking"];
  return ["marking", "teaching-slides"];
}

export function isTutorAttendance(path) {
  return path === "/attendance" || /^\/attendance\/session\/[^/]+$/.test(path);
}

export function canOpenStaffPage(path, pages) {
  if (path === "/students") return pages.includes("students");
  if (path === "/leads") return pages.includes("leads");
  if (path === "/student-results") return pages.includes("results");
  if (path === "/music-studio") return pages.includes("music-studio");
  if (path === "/music-analytics") return pages.includes("music-analytics");
  if (path === "/shared-dictionary") return pages.includes("shared-dictionary");
  if (isTutorAttendance(path)) return pages.includes("attendance");
  if (path === "/teaching-slides" || path.startsWith("/teaching-slides/")) return pages.includes("teaching-slides");
  return path === "/marking" && pages.includes("marking");
}

export function staffHomePath(pages, languages) {
  if (pages.includes("attendance") && languages?.length === 1 && languages[0] === "swahili") return "/attendance";
  return STAFF_PAGES.find(page => pages.includes(page.id))?.path || "/marking";
}
