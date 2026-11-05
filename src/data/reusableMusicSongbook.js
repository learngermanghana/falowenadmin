import { MUSIC_SONG_DRAFTS_A1 } from "./musicSongDraftsA1.js";
import { MUSIC_SONG_DRAFTS_A2_PART1 } from "./musicSongDraftsA2Part1.js";
import { MUSIC_SONG_DRAFTS_A2_PART2 } from "./musicSongDraftsA2Part2.js";
import { MUSIC_SONG_DRAFTS_B1_PART1 } from "./musicSongDraftsB1Part1.js";
import { MUSIC_SONG_DRAFTS_B1_PART2 } from "./musicSongDraftsB1Part2.js";
import { MUSIC_SONG_DRAFTS_B2_PART1 } from "./musicSongDraftsB2Part1.js";
import { MUSIC_SONG_DRAFTS_B2_PART2 } from "./musicSongDraftsB2Part2.js";
import { MUSIC_SONG_DRAFTS_B2_PART3 } from "./musicSongDraftsB2Part3.js";
import { MUSIC_SONG_DRAFTS_B2_PART4 } from "./musicSongDraftsB2Part4.js";
import { MUSIC_SONG_DRAFTS_C1_PART1 } from "./musicSongDraftsC1Part1.js";
import { MUSIC_SONG_DRAFTS_C1_PART2 } from "./musicSongDraftsC1Part2.js";
import { MUSIC_SONG_DRAFTS_C1_PART3 } from "./musicSongDraftsC1Part3.js";
import { MUSIC_SONG_DRAFTS_C1_PART4 } from "./musicSongDraftsC1Part4.js";
import { MUSIC_SONG_DRAFTS_C2_PART1 } from "./musicSongDraftsC2Part1.js";
import { MUSIC_SONG_DRAFTS_C2_PART2 } from "./musicSongDraftsC2Part2.js";
import { MUSIC_SONG_DRAFTS_C2_PART3 } from "./musicSongDraftsC2Part3.js";
import { MUSIC_SONG_DRAFTS_C2_PART4 } from "./musicSongDraftsC2Part4.js";

// Original, prewritten course-song lyrics are retained as small versioned JS
// assets. Looking them up is free and never sends a request to Google/Firebase.
export const REUSABLE_MUSIC_SONGBOOK = Object.freeze({
  A1: MUSIC_SONG_DRAFTS_A1,
  A2: Object.freeze([...MUSIC_SONG_DRAFTS_A2_PART1, ...MUSIC_SONG_DRAFTS_A2_PART2]),
  B1: Object.freeze([...MUSIC_SONG_DRAFTS_B1_PART1, ...MUSIC_SONG_DRAFTS_B1_PART2]),
  B2: Object.freeze([...MUSIC_SONG_DRAFTS_B2_PART1, ...MUSIC_SONG_DRAFTS_B2_PART2, ...MUSIC_SONG_DRAFTS_B2_PART3, ...MUSIC_SONG_DRAFTS_B2_PART4]),
  C1: Object.freeze([...MUSIC_SONG_DRAFTS_C1_PART1, ...MUSIC_SONG_DRAFTS_C1_PART2, ...MUSIC_SONG_DRAFTS_C1_PART3, ...MUSIC_SONG_DRAFTS_C1_PART4]),
  C2: Object.freeze([...MUSIC_SONG_DRAFTS_C2_PART1, ...MUSIC_SONG_DRAFTS_C2_PART2, ...MUSIC_SONG_DRAFTS_C2_PART3, ...MUSIC_SONG_DRAFTS_C2_PART4]),
});

const ALL_SONGS_BY_ASSIGNMENT = new Map(Object.values(REUSABLE_MUSIC_SONGBOOK)
  .flat().map(song => [String(song.assignmentKey).toUpperCase(), song]));

export function getReusableSongDraft(assignmentKey) {
  return ALL_SONGS_BY_ASSIGNMENT.get(String(assignmentKey || "").trim().toUpperCase()) || null;
}

export function getReusableSongDrafts(level) {
  return REUSABLE_MUSIC_SONGBOOK[String(level || "").trim().toUpperCase()] || [];
}

export function countReusableSongDrafts() {
  return Object.values(REUSABLE_MUSIC_SONGBOOK).reduce((sum, songs) => sum + songs.length, 0);
}

export function musicDraftPackageText(song, lesson) {
  if (!song) return "";
  const lines = [
    "FALOWEN MUSIC · REUSABLE COURSE SONG",
    `Title: ${song.title}`,
    `Genre: ${song.genre || "Teacher selected"}`,
    `Level: ${lesson?.level || String(song.assignmentKey).split("-")[0]}`,
    `Day: ${lesson?.day ?? "See course dictionary"}`,
    `Chapter: ${lesson?.chapter || ""}`,
    `Assignment: ${song.assignmentKey}`,
    `Topic: ${lesson?.germanTitle || ""}`,
    "",
    "MUSIC STYLE",
    song.musicStyle,
    "One clear warm lead voice, very soft backing instruments, accurate, naturally phrased German pronunciation appropriate to the specified CEFR level; finish the outro completely and fade gently.",
    "",
    "LYRICS",
    song.lyrics,
    "",
    "Original Falowen course song. Review wording and pronunciation before publishing generated audio.",
  ];
  return lines.join("\n");
}
