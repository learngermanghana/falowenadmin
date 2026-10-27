export function sanitizeFirestoreData(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => {
      const sanitized = sanitizeFirestoreData(item);
      return sanitized === undefined ? null : sanitized;
    });
  }
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    const isPlainObject = prototype === Object.prototype || prototype === null;
    if (!isPlainObject) return value;
    const sanitized = {};
    for (const [key, item] of Object.entries(value)) {
      const next = sanitizeFirestoreData(item);
      if (next !== undefined) sanitized[key] = next;
    }
    return sanitized;
  }
  return value;
}
