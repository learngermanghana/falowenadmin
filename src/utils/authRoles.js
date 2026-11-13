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

export function getPostLoginPath(from, role) {
  const path = from?.pathname || "";
  const fallback = role === "staff" ? "/marking" : "/";
  if (!path.startsWith("/") || path.startsWith("//") || path === "/login") return fallback;
  if (role === "staff" && !isTeachingWorkspace(path)) return fallback;
  return `${path}${from.search || ""}${from.hash || ""}`;
}
