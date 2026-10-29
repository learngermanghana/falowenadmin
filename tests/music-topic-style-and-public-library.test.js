import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getMusicTopicStyle, suggestLessonMusicDirection } from "../src/utils/musicTopicStyle.js";
import { waitingRoomPublishedCatalogTrack, waitingRoomMusicPlaylistForSession } from "../src/utils/waitingRoomDayMusic.js";

test("A1 14.1 health selects gentle caring style and simple CEFR pace without AI generation", () => {
  const entry = { level: "A1", germanTitle: "Gesundheit und Körperteile", englishTitle: "Health and Body Parts" };
  assert.equal(getMusicTopicStyle(entry).label, "Health & care");
  const direction = suggestLessonMusicDirection(entry);
  assert.match(direction, /gentle, reassuring acoustic folk ballad/);
  assert.match(direction, /slow and very clear/);
  assert.match(direction, /One intimate warm lead voice/);
  assert.match(direction, /complete final cadence and gentle fade/);
});

test("genre changes automatically by topic and higher CEFR levels get natural phrasing", () => {
  assert.equal(getMusicTopicStyle({ englishTitle: "Travel and directions" }).label, "Travel & directions");
  assert.equal(getMusicTopicStyle({ germanTitle: "Rezepte und Essen" }).label, "Food & shopping");
  assert.equal(getMusicTopicStyle({ germanTitle: "Familie" }).label, "Family & friendship");
  assert.match(suggestLessonMusicDirection({ level: "B1", germanTitle: "Beruf und Karriere" }), /moderate and conversational/);
  assert.match(suggestLessonMusicDirection({ level: "C1", englishTitle: "Innovation" }), /natural and expressive/);
  const instrumental = suggestLessonMusicDirection({ level: "A2", germanTitle: "Gesundheit" }, { instrumental: true });
  assert.match(instrumental, /Instrumental only, no voice/);
  assert.doesNotMatch(instrumental, /One intimate warm lead voice/);
});

test("approved public catalog selects one matching attendance day song and no other day", () => {
  const catalog = { tracks: [
    { id: "general", level: "ALL", day: null, title: "Welcome", audioUrl: "https://admin.falowen.app/general.mp3", attendance: true },
    { id: "health", level: "A1", day: 22, title: "Mein Kopf tut weh", audioUrl: "https://music.falowen.app/music/a1/day-22/zoom-01.mp3", attendance: true },
    { id: "other", level: "A2", day: 22, title: "Other", audioUrl: "https://music.falowen.app/music/a2/day-22/zoom-01.mp3", attendance: true },
  ] };
  const song = waitingRoomPublishedCatalogTrack(catalog, { level: "A1", day: 22 });
  assert.equal(song.title, "Mein Kopf tut weh");
  assert.equal(song.repeat, true);
  assert.equal(song.objectKey, "a1/day-22/zoom-01.mp3");
  assert.equal(waitingRoomPublishedCatalogTrack(catalog, { level: "A1", day: 23 }), null);
  assert.equal(waitingRoomPublishedCatalogTrack(catalog, { level: "B1", day: 22 }), null);
  assert.equal(waitingRoomPublishedCatalogTrack({ tracks: [{ id: "bad", title: "Bad", level: "A1", day: 22, attendance: true, audioUrl: "https://secret.r2.cloudflarestorage.com/a1.mp3" }] }, { level: "A1", day: 22 }), null);
});

test("existing fallback still works if public catalog is empty or unavailable", () => {
  const fallback = [{ id: "local", src: "/Gemeinsam%20schaffen%20wir%20das.mp3", title: "Welcome" }];
  assert.equal(waitingRoomPublishedCatalogTrack({ tracks: [] }, { level: "A1", day: 1 }), null);
  assert.equal(waitingRoomMusicPlaylistForSession({ level: "A1", day: 1, fallbackPlaylist: fallback }), fallback);
  const page = readFileSync(new URL("../src/pages/CheckinDisplayPage.jsx", import.meta.url), "utf8");
  assert.match(page, /https:\/\/music\.falowen\.app\/music\/catalog\.json/);
  assert.match(page, /waitingRoomPublishedCatalogTrack/);
  assert.match(page, /\.catch\(\(\) => \{\}\)/);
  assert.match(page, /\.\.\.pianoPlaylist/);
  const studio = readFileSync(new URL("../src/pages/MusicStudioPage.jsx", import.meta.url), "utf8");
  assert.match(studio, /useState\('auto'\)/);
  assert.match(studio, /Automatically match the lesson topic/);
  assert.match(studio, /readOnly=\{productionProfile !== 'auto' \|\| styleMode === 'auto'/);
  assert.match(studio, /brief: productionBrief/);
});
