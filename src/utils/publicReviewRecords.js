// Public website reviews are read from the canonical learner repo's reviews.json.
// Social Studio may add its own local drafts, but these public rows carry stable source IDs.
const STAR_VALUES = Object.freeze({ ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 });

export function normalizePublicReviewRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((row, index) => {
    const studentName = String(row?.reviewer?.displayName || "").trim();
    const review = String(row?.comment || "").trim();
    if (!studentName || !review) return null;
    const publicId = String(row.name || row.importId || (row.sourceUrl ? "source:" + row.sourceUrl : ""));
    const rating = STAR_VALUES[row.starRating] || null;
    return {
      id: publicId || "public-review-" + index,
      publicId,
      studentName,
      review,
      course: "",
      source: "Google Review",
      sourceUrl: String(row.sourceUrl || ""),
      rating,
      date: String(row.createTime || "").slice(0, 10),
      status: "Published",
      shared: true,
      ratingStatus: rating ? "verified_in_export" : "not_verified",
    };
  }).filter(Boolean);
}
