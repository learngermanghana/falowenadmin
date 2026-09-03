function parseAssignmentChapter(assignmentId) {
  const normalized = String(assignmentId || "").trim();
  const match = normalized.match(/^[A-Z]\d(?:-|\s+)(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

module.exports = { parseAssignmentChapter };
