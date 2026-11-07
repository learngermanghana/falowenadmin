// Matching exercises are often pasted as a person's name followed by a letter.
// Only use this fallback for a known choice question, never for reference keys
// or free-text answers. Keep prose and multiple/conflicting choices out.
export function extractNamedChoiceAnswer(value = "") {
  const cleaned = String(value || "").replace(/\p{Cf}/gu, "").trim();
  const match = cleaned.match(/^((?:\p{Lu}[\p{L}\p{M}'’\-]*)(?:\s+(?:\p{Lu}[\p{L}\p{M}'’\-]*|und|von|van|de)){0,5})\s+([A-HXa-hx])\s*[.)]?$/u);
  if (!match) return "";
  // A label containing a standalone choice letter is ambiguous (e.g. "A B").
  if (match[1].split(/\s+/).some((word) => /^[A-HX]$/i.test(word))) return "";
  return match[2].toUpperCase();
}
