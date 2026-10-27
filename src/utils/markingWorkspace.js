import { normalizeAnswerKeyEntry } from "./answerKeyNormalizer.js";
export function answerKeyComparison(local, registry) {
  if (!local) return "unselected";
  if (!registry) return "missing";
  const normalized = normalizeAnswerKeyEntry(local.assignment || local.title || "", local);
  const sortObject = (value) => Array.isArray(value) ? value.map(sortObject) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])])) : value;
  const fingerprint = (entry) => JSON.stringify(sortObject({
    parts: entry.parts,
    writingParts: [...(entry.writingParts || [])].sort(),
    referenceAnswerParts: [...(entry.referenceAnswerParts || [])].sort(),
  }));
  return fingerprint(normalized) === fingerprint(registry) ? "matched" : "different";
}
export function feedbackWordCount(text) { return String(text || "").trim().split(/\s+/).filter(Boolean).length; }
