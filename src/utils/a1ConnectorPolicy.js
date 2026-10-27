export function allowsConnectorAssessment(level = "", assignmentKey = "") {
  if (String(level).toUpperCase() !== "A1") return true;
  const chapter = String(assignmentKey).toUpperCase().match(/^A1-(\d+)(?:\.(\d+))?$/);
  if (!chapter) return false;
  const unit = Number(chapter[1]);
  const section = Number(chapter[2] || 0);
  return (unit === 12 && section >= 3) || unit === 13 || (unit === 14 && section <= 1);
}
