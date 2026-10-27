function clean(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function splitParagraphSentences(paragraph = "") {
  const text = clean(paragraph);
  if (!text) return [];
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9„"'])/u)
    .map(clean)
    .filter(Boolean);
  return sentences.length ? sentences : [text];
}

export function buildReadingChunks(text = "", level = "A2", maxReaders = 6) {
  const normalizedLevel = String(level || "").trim().toUpperCase();
  const maxSentences = normalizedLevel === "B1" ? 3 : 2;
  const paragraphs = String(text || "")
    .split(/\n\s*\n|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const rawChunks = [];
  paragraphs.forEach((paragraph) => {
    const sentences = splitParagraphSentences(paragraph);
    for (let index = 0; index < sentences.length; index += maxSentences) {
      rawChunks.push(sentences.slice(index, index + maxSentences).join(" "));
    }
  });

  if (!rawChunks.length) return [];
  const limit = Math.max(1, Number(maxReaders || 1));
  const chunks = [...rawChunks];

  while (chunks.length > limit) {
    let smallestIndex = 0;
    let smallestLength = Number.POSITIVE_INFINITY;
    for (let index = 0; index < chunks.length - 1; index += 1) {
      const combinedLength = chunks[index].length + chunks[index + 1].length;
      if (combinedLength < smallestLength) {
        smallestLength = combinedLength;
        smallestIndex = index;
      }
    }
    chunks.splice(smallestIndex, 2, `${chunks[smallestIndex]} ${chunks[smallestIndex + 1]}`);
  }

  return chunks.map((chunk, index) => ({
    id: `reading-chunk-${index + 1}`,
    index,
    label: `Section ${index + 1}`,
    text: clean(chunk),
  }));
}

function historyCount(history = {}, role = "", key = "") {
  return Number(history?.[role]?.[key] || 0);
}

function turnsFor(stats = {}, key = "") {
  return Number(stats?.[key]?.turns || 0);
}

export function buildFairReadingAssignments({
  chunks = [],
  roster = [],
  stats = {},
  history = {},
  level = "A2",
} = {}) {
  const students = (Array.isArray(roster) ? roster : [])
    .filter((entry) => entry?.key && entry?.name);
  if (!students.length || !chunks.length) return [];

  const readerLoads = new Map(students.map((entry) => [entry.key, historyCount(history, "reader", entry.key)]));
  const listenerLoads = new Map(students.map((entry) => [entry.key, historyCount(history, "listener", entry.key)]));
  const assignedReaders = new Set();

  const byReaderFairness = (a, b) =>
    Number(readerLoads.get(a.key) || 0) - Number(readerLoads.get(b.key) || 0)
    || turnsFor(stats, a.key) - turnsFor(stats, b.key)
    || a.name.localeCompare(b.name);

  const byListenerFairness = (a, b) =>
    Number(listenerLoads.get(a.key) || 0) - Number(listenerLoads.get(b.key) || 0)
    || Number(assignedReaders.has(a.key)) - Number(assignedReaders.has(b.key))
    || turnsFor(stats, a.key) - turnsFor(stats, b.key)
    || a.name.localeCompare(b.name);

  return chunks.map((chunk, index) => {
    const reader = [...students].sort(byReaderFairness)[0];
    readerLoads.set(reader.key, Number(readerLoads.get(reader.key) || 0) + 1);
    assignedReaders.add(reader.key);

    const listenerCandidates = students.filter((entry) => entry.key !== reader.key);
    const listener = listenerCandidates.length ? [...listenerCandidates].sort(byListenerFairness)[0] : null;
    if (listener) listenerLoads.set(listener.key, Number(listenerLoads.get(listener.key) || 0) + 1);

    const listenerQuestion = String(level || "").toUpperCase() === "B1"
      ? "Fasse die Hauptidee kurz zusammen und nenne ein wichtiges Detail."
      : "Was ist die Hauptidee? Nenne ein wichtiges Detail.";

    return {
      id: `${chunk.id}-assignment`,
      index,
      chunk,
      reader,
      listener,
      listenerQuestion,
    };
  });
}

export function incrementReadingHistory(history = {}, assignment = {}) {
  const next = {
    reader: { ...(history.reader || {}) },
    listener: { ...(history.listener || {}) },
  };
  if (assignment.reader?.key) {
    next.reader[assignment.reader.key] = Number(next.reader[assignment.reader.key] || 0) + 1;
  }
  if (assignment.listener?.key) {
    next.listener[assignment.listener.key] = Number(next.listener[assignment.listener.key] || 0) + 1;
  }
  return next;
}
