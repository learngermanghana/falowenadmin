function normalizedLabel(value = "") {
  return String(value || "")
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "")
    .trim();
}

export function normalizeSubmissionPart(label = "", explicitNumber = "") {
  if (explicitNumber) return `teil${Number(explicitNumber)}`;
  const normalized = normalizedLabel(label);
  const numbered = normalized.match(/(?:teil|tiel|part)([1-4])/);
  if (numbered) return `teil${Number(numbered[1])}`;
  if (/schreiben|writing/.test(normalized)) return "teil2";
  if (/lesen|reading/.test(normalized)) return "teil3";
  if (/horen|hoeren|listening|audio/.test(normalized)) return "teil4";
  return "main";
}

function normalizeQSectionAliases(text = "") {
  const raw = String(text || "");
  const alias = /(^|\n)[ \t]*q(?:uestion)?[ \t]*([1-4])(?:\.[ \t]*\d+(?=[ \t]+\d{1,3}\s*[).:])|\.[ \t]*(?=\d{1,3}\s*[).:])|(?=[ \t]*(?:\n|$)))[ \t]*/gi;
  const normalized = raw.replace(alias, (_match, prefix, partNumber) => `${prefix}Teil ${partNumber}\n`);

  const hasImplicitOpeningAnswers = normalized !== raw
    && /^\s*\d{1,3}\s*[).:]/.test(normalized)
    && /(?:^|\n)Teil 2\n/i.test(normalized);

  return hasImplicitOpeningAnswers ? `Teil 1\n${normalized}` : normalized;
}

export function parseSubmissionSections(text = "") {
  const source = normalizeQSectionAliases(text);
  const markerRegex = /(?:^|\n)[ \t]*((?:teil|tiel|part)[ \t]*([1-4])(?:[ \t]*(?:[.:;|·•–-][ \t]*)?(?:lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing))?|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \t]*(?:\([^\n)]*\))?[ \t]*[.:;]?[ \t]*/gi;
  const markers = [];
  let match;

  while ((match = markerRegex.exec(source))) {
    const partId = normalizeSubmissionPart(match[1], match[2]);
    markers.push({
      index: match.index,
      end: markerRegex.lastIndex,
      partId,
      partNumber: Number(partId.replace("teil", "")) || null,
      heading: String(match[1] || "").trim(),
    });
  }

  if (!markers.length) {
    return [{ partId: "main", partNumber: null, heading: "", text: source }];
  }

  const sections = [];
  markers.forEach((marker, index) => {
    const next = markers[index + 1];
    sections.push({
      partId: marker.partId,
      partNumber: marker.partNumber,
      heading: marker.heading,
      text: source.slice(marker.end, next ? next.index : source.length).trim(),
    });
  });
  return sections;
}
