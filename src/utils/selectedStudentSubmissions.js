// Keep an explicitly requested nested document through the student-loading effect.
export async function loadStudentSubmissionsWithSelection({ student, exactPath, fetchSubmissions, fetchSubmissionByPath }) {
  let rows;
  try {
    rows = await fetchSubmissions(student.level, student.studentCode);
  } catch (error) {
    if (!exactPath || !["permission-denied", "firestore/permission-denied"].includes(error?.code)) throw error;
    const selectedRow = await fetchSubmissionByPath(exactPath);
    return selectedRow ? [selectedRow] : [];
  }
  if (!exactPath || rows.some((row) => row.path === exactPath)) return rows;
  const selectedRow = await fetchSubmissionByPath(exactPath);
  return selectedRow ? [selectedRow, ...rows] : rows;
}
