const text = value => String(value || "").trim();
const comparable = value => text(value).toLowerCase();

export function readPresenterClassContext(search = "") {
  const params = new URLSearchParams(search);
  const date = text(params.get("sessionDate"));
  return {
    classRecordId: text(params.get("classRecordId")),
    classId: text(params.get("classId")),
    sessionDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
  };
}

export function requestedPresenterClass(classes, context) {
  // Prefer the document identity when a URL contains both document ID and name.
  for (const requested of [context.classRecordId, context.classId].filter(Boolean)) {
    const match = classes.find(entry => [entry.id, entry.classRecordId, entry.classId, entry.name]
      .some(value => comparable(value) && comparable(value) === comparable(requested)));
    if (match) return match;
  }
  return null;
}
