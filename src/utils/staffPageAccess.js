export const STAFF_PAGES = Object.freeze([
  { id: "marking", label: "Marking", path: "/marking" },
  { id: "teaching-slides", label: "Teaching Slides", path: "/teaching-slides" },
  { id: "attendance", label: "Attendance", path: "/attendance" },
]);

export function staffPageIds(value, role) {
  if (Array.isArray(value)) {
    return STAFF_PAGES.map(page => page.id).filter(id => value.includes(id));
  }
  if (role === "teacher") return STAFF_PAGES.map(page => page.id);
  if (role === "reviewer") return ["marking"];
  return ["marking", "teaching-slides"];
}

export function isTutorAttendance(path) {
  return path === "/attendance" || /^\/attendance\/session\/[^/]+$/.test(path);
}

export function canOpenStaffPage(path, pages) {
  if (isTutorAttendance(path)) return pages.includes("attendance");
  if (path === "/teaching-slides" || path.startsWith("/teaching-slides/")) return pages.includes("teaching-slides");
  return path === "/marking" && pages.includes("marking");
}

export function staffHomePath(pages, languages) {
  if (pages.includes("attendance") && languages?.length === 1 && languages[0] === "swahili") return "/attendance";
  return STAFF_PAGES.find(page => pages.includes(page.id))?.path || "/marking";
}
