export function attendanceFingerprint(attendance = {}) {
  const stable = value => value && typeof value === "object"
    ? Array.isArray(value) ? value.map(stable) : Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value;
  const content = JSON.stringify(stable({ students: attendance.students || {}, records: attendance.records || [], markedBy: attendance.markedBy || "" }));
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) hash = Math.imul(hash ^ content.charCodeAt(index), 16777619);
  return String(hash >>> 0);
}
export function captureFields(document = {}, keys = []) {
  const values = {}, missing = [];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(document, key) && document[key] !== undefined) values[key] = document[key];
    else missing.push(key);
  }
  return { values, missing };
}
export function restoreFields(snapshot, deleteValue) {
  return { ...snapshot.values, ...Object.fromEntries(snapshot.missing.map(key => [key, deleteValue()])) };
}
export function assertUndoAvailable(undo, klass, sessions, attendances = []) {
  if (!undo || undo.version !== klass.sessionScheduleVersion) throw new Error("This schedule has changed since the saved action. Undo is no longer available.");
  for (const change of undo.changes) {
    if (change.attendanceFingerprint && change.attendanceFingerprint !== attendanceFingerprint(attendances.find(row => row.id === change.id) || {})) {
      throw new Error("Attendance was recorded or changed after this action. Undo cannot change its lesson dates.");
    }
    const session = sessions.find(row => row.id === change.id);
    if (!session || Number(session.sequence || 0) !== change.sequence || ["completed", "live"].includes(String(session.status).toLowerCase())) {
      throw new Error("A lesson has changed or been taught since this action. Undo cannot overwrite it.");
    }
  }
}
