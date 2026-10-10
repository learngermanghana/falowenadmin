// Keep an explicitly requested nested document through the student-loading effect.
export async function loadStudentSubmissionsWithSelection({ student, exactPath, fetchSubmissions, fetchSubmissionByPath }) {
  const rows = await fetchSubmissions(student.level, student.studentCode);
  if (!exactPath || rows.some((row) => row.path === exactPath)) return rows;
  const selectedRow = await fetchSubmissionByPath(exactPath);
  return selectedRow ? [selectedRow, ...rows] : rows;
}
