function escapeRegExp(value = "") {
  return String(value || "").replace(/[.*+?^\${}()|[\]\\]/g, (match) => "\\" + match);
}

function isWordCharacter(value = "") {
  return Boolean(value) && /[\p{L}\p{N}_]/u.test(value);
}

export function splitWarmupQuestionSegments(question = "", keywords = []) {
  const text = String(question || "");
  const terms = [...new Set(
    (Array.isArray(keywords) ? keywords : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  )].sort((a, b) => b.length - a.length);

  if (!terms.length || !text) return [{ text, highlighted: false }];

  const pattern = new RegExp(terms.map(escapeRegExp).join("|"), "giu");
  const segments = [];
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text))) {
    const start = match.index;
    const end = start + match[0].length;
    const before = start > 0 ? text[start - 1] : "";
    const after = end < text.length ? text[end] : "";

    if (isWordCharacter(before) || isWordCharacter(after)) {
      pattern.lastIndex = start + 1;
      continue;
    }

    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: match[0], highlighted: true });
    cursor = end;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments.length ? segments : [{ text, highlighted: false }];
}
