function text(value) {
  return String(value ?? "").trim();
}

function pathSegments(value) {
  return text(value).split("/").map((part) => part.trim()).filter(Boolean);
}

export function inferSubmissionIdentityFromPath(value) {
  const segments = pathSegments(value);
  const normalized = segments.map((part) => part.toLowerCase());

  const studentsIndex = normalized.lastIndexOf("students");
  if (studentsIndex >= 0 && segments[studentsIndex + 1]) {
    return {
      studentCode: segments[studentsIndex + 1],
      level: studentsIndex >= 2 && normalized[studentsIndex - 2] === "classes" ? segments[studentsIndex - 1] : "",
    };
  }

  const submissionsIndex = normalized.indexOf("submissions");
  if (submissionsIndex >= 0 && segments.length >= submissionsIndex + 4) {
    return {
      level: segments[submissionsIndex + 1],
      studentCode: segments[submissionsIndex + 2],
    };
  }

  return { studentCode: "", level: "" };
}

export function submissionPathFromRow(row = {}) {
  return text(
    row.submissionPath ||
      row.submission_path ||
      row.result?.submissionPath ||
      row.result?.submission_path ||
      row.data?.submissionPath ||
      row.data?.submission_path ||
      row.raw?.submissionPath ||
      row.raw?.submission_path,
  );
}

export function inferSubmissionIdentity(row = {}) {
  return inferSubmissionIdentityFromPath(submissionPathFromRow(row) || row.path || row.firestorePath || row.refPath || row.documentPath || "");
}
