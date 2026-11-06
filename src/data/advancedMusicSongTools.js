// Edited, authored advanced German song drafts. No model invocation or
// generation at lookup time. Every lyric is a standalone original story.
export function defineAdvancedSongDrafts(entries) {
  return Object.freeze(entries.map(({ key, title, genre, tempo, arrangement, lyrics, curriculumTopic }) => {
    const assignmentKey = String(key || "").trim();
    const cleaned = String(lyrics || "").trim();
    if (!/^(B2-|C1 |C2-)/.test(assignmentKey) || !title || !genre || !arrangement
      || !/^\[Verse 1\]/.test(cleaned) || !cleaned.includes("[Chorus]")
      || !cleaned.includes("[Outro]") || /falowen/i.test(cleaned)) {
      throw new Error("Invalid advanced song draft: " + assignmentKey);
    }
    return Object.freeze({
      assignmentKey,
      ...(curriculumTopic ? {curriculumTopic} : {}),
      title,
      genre,
      musicStyle: genre + ", " + tempo + " BPM: " + arrangement
        + " An adult lead vocalist with articulate, natural German phrasing and dynamic emotional delivery; do not sing section labels. Keep the accompaniment below the voice and complete the last phrase before fading.",
      lyrics: cleaned,
    });
  }));
}
