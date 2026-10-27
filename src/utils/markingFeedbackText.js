export function stripMarkingEmojis(value = "") {
  return String(value || "")
    .replace(/(?:[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\uFE0F|\uFE0E|\u200D|\u20E3)/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

export function plainObjectiveAnswer(value = "", fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const letter = text.match(/^["'“”‘’„«»]*\s*([A-F])\s*["'“”‘’„«»]*$/i)?.[1];
  return letter ? letter.toUpperCase() : text || fallback;
}
