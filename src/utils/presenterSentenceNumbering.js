export function splitPresenterSentences(value = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [];

  try {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      return [...new Intl.Segmenter("de", { granularity: "sentence" }).segment(text)]
        .map(({ segment }) => String(segment || "").trim())
        .filter(Boolean);
    }
  } catch {
    // Fall through to the punctuation-based splitter below.
  }

  return (text.match(/[^.!?]+(?:[.!?]+[”"'»]?|$)/g) || [text])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function numberedPresenterSentences(value = "") {
  return splitPresenterSentences(value).map((text, index) => ({
    number: index + 1,
    text,
  }));
}
