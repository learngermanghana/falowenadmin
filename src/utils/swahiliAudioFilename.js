// Use the existing course dictionary, not an AI-generated title.
export function swahiliAudioFileBase(level, lesson, topic = "") {
  const slug = (value) => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
  const prefix = `swahili-${slug(level)}`;
  if (!lesson) return `${prefix}-${slug(topic) || "custom-topic"}`;
  const day = String(lesson.assignment_id).match(/day-(\d+)$/i)?.[1];
  const title = String(lesson.en || "")
    .split("·")
    .map((part) => part.trim())
    .filter((part) => part && !/^somo la \d+$/i.test(part) && !/^\d+(?:\.\d+)*$/.test(part))
    .join(" ");
  return [prefix, day ? `day-${day}` : slug(lesson.assignment_id), slug(title)].filter(Boolean).join("-");
}
