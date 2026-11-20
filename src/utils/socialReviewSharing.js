// Reusable client-only sharing copy. Never generate facts about a learner.
export const REVIEW_CAPTION_STYLES = Object.freeze([
  { id: "falowen", label: "Falowen Reviews" },
  { id: "milestone", label: "Learning Journey" },
  { id: "short", label: "Quick Share" },
]);

export const REVIEW_POSTER_THEMES = Object.freeze([
  { id: "blue", label: "Falowen Blue" },
  { id: "gold", label: "Premium Gold" },
  { id: "light", label: "Minimal White" },
]);

export const PUBLIC_REVIEW_SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5Nm-MLJkw3TeOht5ROELvFumVS9X8-ke_npLoOuF3W-zrF0v9xjk_Upzv4umQCocD5xtFaMRJQh6Z/pub?output=csv";

const safe = (value) => String(value ?? "").trim();

function tagsFor(review) {
  const course = safe(review.course).toLowerCase();
  const swahili = course.includes("swahili") || course.includes("kiswahili");
  return swahili
    ? "#Falowen #LearnKiswahili #SwahiliLearning #StudentReviews"
    : "#Falowen #LearnGerman #DeutschLernen #GermanLessons #StudentReviews";
}

export function buildReviewCaption(review = {}, styleId = "falowen", platform = "instagram") {
  const name = safe(review.studentName) || "Falowen learner";
  const level = safe(review.course);
  const source = safe(review.source);
  const quote = safe(review.review);
  const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
  const credit = [name, level, source].filter(Boolean).join(" · ");
  const header = styleId === "milestone" ? "🎓 A FALOWEN LEARNING JOURNEY"
    : styleId === "short" ? "💬 FALOWEN REVIEWS"
    : "⭐ FALOWEN REVIEWS | STUDENT VOICES";
  const lead = styleId === "milestone"
    ? "Learning progress, in a student's own words."
    : styleId === "short" ? "Hear from a Falowen learner."
    : "Real feedback from a learner at Learn Language Education Academy.";
  const thanks = styleId === "milestone"
    ? "Thank you for sharing your learning experience with us."
    : "Thank you for sharing your experience with Falowen!";
  const lines = [
    header,
    "",
    lead,
    "",
    "⭐".repeat(rating),
    "“" + quote + "”",
    "— " + credit,
    "",
    thanks,
    "",
    "Explore Falowen: https://www.falowen.app",
  ];
  if (platform !== "whatsapp") lines.push("", tagsFor(review));
  return lines.join("\n");
}

// Proper CSV parser, including escaped quotes, commas and multiline reviews.
export function parseReviewCsv(csv) {
  const rows = [];
  let cells = [], cell = "", quoted = false;
  const input = String(csv || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim()); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i++;
      cells.push(cell.trim()); cell = "";
      if (cells.some(Boolean)) rows.push(cells);
      cells = [];
    } else cell += char;
  }
  cells.push(cell.trim());
  if (cells.some(Boolean)) rows.push(cells);
  if (rows.length < 2) return [];
  const headers = rows.shift().map((h) => h.replace(/[^a-z0-9]/gi, "").toLowerCase());
  const col = (...names) => headers.findIndex((h) => names.includes(h));
  const nameCol = col("studentname", "name", "reviewer", "author");
  const quoteCol = col("reviewtext", "review", "text", "testimonial", "comment");
  const courseCol = col("course", "class", "courselevel", "languagelevel");
  const levelCol = col("level");
  const ratingCol = col("rating", "stars", "starrating");
  const sourceCol = col("source", "platform");
  const dateCol = col("date", "reviewdate", "createdat");
  if (quoteCol < 0) return [];
  return rows.map((row, index) => {
    const studentName = safe(row[nameCol] || "");
    const review = safe(row[quoteCol] || "");
    if (!review || !studentName) return null;
    const rawRating = safe(row[ratingCol] || "");
    const rating = /^[1-5](?:\.0)?$/.test(rawRating) ? Number(rawRating) : 5;
    const sourceRaw = safe(row[sourceCol]).toLowerCase();
    const source = sourceRaw.includes("google") ? "Google Review" : "Student feedback";
    return {
      id: "sheet-" + index + "-" + studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      studentName: studentName.slice(0, 100),
      review: review.slice(0, 1800),
      course: safe(row[courseCol] || row[levelCol] || "").slice(0, 80),
      rating,
      source,
      date: safe(row[dateCol]).slice(0, 20),
      status: "Approved",
      shared: true,
    };
  }).filter(Boolean);
}

export function mergeReviewSources(seed, shared, saved) {
  const all = [];
  const keys = new Map();
  const normalized = (x) => safe(x).toLowerCase().replace(/\s+/g, " ");
  // Priority: locally edited record > shared data > seed.
  for (const review of [...seed, ...shared, ...saved]) {
    if (!review || !safe(review.studentName) || !safe(review.review)) continue;
    const identity = normalized(review.studentName) + "|" + normalized(review.review);
    if (keys.has(identity)) all[keys.get(identity)] = { ...all[keys.get(identity)], ...review };
    else { keys.set(identity, all.length); all.push({ ...review }); }
  }
  return all;
}

export function searchReviews(reviews, query = "", level = "all", status = "all") {
  const q = safe(query).toLowerCase();
  return reviews.filter((review) => {
    const matchingText = !q || [review.studentName, review.review, review.source, review.course]
      .some((part) => safe(part).toLowerCase().includes(q));
    const matchingLevel = level === "all" || safe(review.course).toUpperCase().includes(level.toUpperCase());
    const matchingStatus = status === "all" || safe(review.status || "Draft") === status;
    return matchingText && matchingLevel && matchingStatus;
  });
}
