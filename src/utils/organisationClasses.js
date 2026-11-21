export function availableOrganisationClasses(data = {}) {
  if (!Array.isArray(data.classes)) throw new Error("Could not load available classes. Please retry.");
  const classes = [...data.classes, ...(Array.isArray(data.swahiliClasses) ? data.swahiliClasses : [])];
  return classes
    .filter(course => course.registrationOpen !== false && course.publicVisible !== false &&
      course.availability !== "always" && !course.isSelfLearning && (course.id || course.slug) && course.startDate)
    .map(course => ({
      id: String(course.id || course.slug),
      name: String(course.title || course.name || ""),
      level: String(course.level || course.levelId || "").toUpperCase(),
      language: String(course.language || "German").toLowerCase() === "swahili" ? "Swahili" : "German",
      startDate: String(course.startDate).slice(0, 10),
    }))
    .filter(course => course.name && /^(A1|A2|B1|B2|C1|C2)$/.test(course.level));
}

export function matchingOrganisationClasses(classes, language, level) {
  return classes.filter(course => course.language === language && course.level === String(level || "").toUpperCase());
}

export async function loadOrganisationClasses() {
  const response = await fetch("/api/public/classes", { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error("Could not load available classes. Please retry.");
  return availableOrganisationClasses(await response.json());
}
