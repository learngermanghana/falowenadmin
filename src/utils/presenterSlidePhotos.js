// Curated, locally hosted classroom photos. Never fetch images from an API
// during a lesson: content must be predictable, quick to load and cost-free.
const PHOTOS = Object.freeze({
  boutique: {
    src: "/presenter-photos/boutique.jpg",
    alt: "Clothes hanging inside a boutique",
  },
  shopping: {
    src: "/presenter-photos/clothes-shopping.jpg",
    alt: "Someone choosing clothes from a shop rail",
  },
  interview: {
    src: "/presenter-photos/job-interview.jpg",
    alt: "A business professional dressed for an interview",
  },
  outfit: {
    src: "/presenter-photos/outfit.jpg",
    alt: "An outfit with a shirt, shoes, watch and trousers",
  },
});

const ASSIGNMENT_PHOTOS = Object.freeze({
  "A2-5.12": "interview", // Mein Traumberuf
  "A2-5.13": "interview", // Ein Vorstellungsgespräch
  "A2-5.14": "interview", // Beruf und Karriere
  "A2-7.19": "shopping", // Einkaufen – wo und wie?
  "B1-6.18": "interview", // Wege zum Wunschberuf
  "B1-6.19": "interview", // Das Vorstellungsgespräch
  "B1-8.25": "boutique", // Online einkaufen – Rechte und Risiken
  "B2-1.4": "interview", // Beruf und Karriere
});

function assignmentId(slide = {}) {
  return String(slide.assignmentId || slide.assignment_id || slide.assignmentKey || "")
    .trim()
    .toUpperCase();
}

export function getPresenterSlidePhoto(slide = {}, stage = {}) {
  // Never compete with exam tasks, teacher marking, timers, questions or dense grammar.
  const stageType = String(stage.type || "");
  if (stageType !== "intro" && stageType !== "vocabulary") return null;
  if (stageType === "vocabulary" && (!Array.isArray(stage.items) || stage.items.length > 3)) return null;

  const level = String(slide.course || slide.level || "").toUpperCase();
  const title = String(slide.title || slide.topic || "");
  const assetId = ASSIGNMENT_PHOTOS[assignmentId(slide)]
    || (level === "A1" && /\b(?:kleidung|kleider|anziehen|sich anziehen)\b/i.test(title) ? "outfit" : "");
  const image = PHOTOS[assetId];
  if (!image) return null;

  // This is a decorative, absolutely positioned layer: it must never create
  // a new grid row or reduce the space available to lesson/teacher controls.
  const density = stageType === "vocabulary" || stage.studentReference
    || String(stage.objective || "").length > 190
    ? "compact" : "wide";
  return { ...image, density };
}

export const PRESENTER_PHOTO_PATHS = Object.freeze(
  Object.values(PHOTOS).map(({ src }) => src),
);
