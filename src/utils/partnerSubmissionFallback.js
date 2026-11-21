// Recover only the missing student rosters referenced by a single partner.
// The owner-only API is paginated across *all* organisations, not per partner.
// Read the next page on demand until all referenced batches are found or history ends.
export async function loadPartnerSubmissionFallback(
  submissions,
  request,
  { onPage = () => {}, isCancelled = () => false } = {},
) {
  const unresolved = new Set(
    (submissions || [])
      .filter(batch => batch?.id && !Array.isArray(batch.students))
      .map(batch => String(batch.id)),
  );
  const found = new Map();
  const visited = new Set();
  let cursor = "";

  while (unresolved.size > 0 && !isCancelled()) {
    if (visited.has(cursor)) {
      throw new Error("Submission history returned a repeated page cursor. Some student names could not be loaded.");
    }
    visited.add(cursor);
    const path = "admin/organisation-enrolments" + (cursor ? "?cursor=" + encodeURIComponent(cursor) : "");
    const page = await request(path);
    if (isCancelled()) break;

    const matched = [];
    for (const batch of page.submissions || []) {
      if (unresolved.delete(batch.id)) {
        found.set(batch.id, batch);
        matched.push(batch);
      }
    }
    if (matched.length) onPage(matched);

    const next = String(page.nextCursor || "").trim();
    if (!next) break;
    cursor = next;
  }

  return { submissions: [...found.values()], missingIds: [...unresolved] };
}
