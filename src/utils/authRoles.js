import { canOpenStaffPage, staffHomePath, staffPageIds } from "./staffPageAccess.js";
export { isTutorAttendance } from "./staffPageAccess.js";

export const STAFF_ACCOUNT_EMAIL = "staff@falowen.app";
const OWNER_ACCOUNT_EMAIL = "moxflex@gmail.com";

export function getAdminRole(claims = {}) {
  const verifiedEmail = claims.email_verified === true ? claims.email?.toLowerCase() : "";
  if (claims.admin === true || claims.role === "admin" || verifiedEmail === OWNER_ACCOUNT_EMAIL) return "admin";
  if (claims.staff === true || ["staff", "tutor"].includes(claims.role) || verifiedEmail === STAFF_ACCOUNT_EMAIL) return "staff";
  return null;
}

export function isTeachingWorkspace(pathname) {
  return pathname === "/marking" || pathname === "/teaching-slides" || pathname.startsWith("/teaching-slides/");
}

export function getPostLoginPath(from, role, claims = {}) {
  const path = from?.pathname || "";
  const pages = staffPageIds(claims.staffPages, claims.staffRole);
  const fallback = role === "staff" ? staffHomePath(pages, claims.staffLanguages) : "/";
  if (!path.startsWith("/") || path.startsWith("//") || path === "/login") return fallback;
  if (role === "staff" && !canOpenStaffPage(path, pages)) return fallback;
  return `${path}${from.search || ""}${from.hash || ""}`;
}
