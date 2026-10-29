import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getMusicTopicStyle, suggestLessonMusicDirection } from "../src/utils/musicTopicStyle.js";
import { waitingRoomPublishedCatalogTrack, waitingRoomMusicPlaylistForSession, waitingRoomDiscoveredMusicTrack } from "../src/utils/waitingRoomDayMusic.js";

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

test("R2-discovered uploaded A2 Day 19 and 20 songs are selected by exact course day", () => {
  const day19 = { id: "r2-a2-day-19-lieber-online-oder-im-laden", level: "A2", day: 19,
    title: "Lieber online oder im Laden", objectKey: "music/a2/day-19/lieber-online-oder-im-laden.mp3",
    audioUrl: "https://www.falowen.app/api/music?track=r2-a2-day-19-lieber-online-oder-im-laden",
    autoDiscovered: true, coursebook: true };
  const day20 = { ...day19, id: "r2-a2-day-20-die-jacke-ist-zu-klein", day: 20,
    title: "Die Jacke ist zu klein", objectKey: "music/a2/day-20/die-jacke-ist-zu-klein.mp3",
    audioUrl: "https://www.falowen.app/api/music?track=r2-a2-day-20-die-jacke-ist-zu-klein" };
  const feed = { ok: true, tracks: [day20, day19] };
  const matching19 = waitingRoomDiscoveredMusicTrack(feed, { level: "A2", day: 19, assignmentKey: "A2-7.19" });
  assert.equal(matching19.src, day19.audioUrl);
  assert.equal(matching19.objectKey, day19.objectKey);
  assert.equal(matching19.repeat, true);
  assert.equal(matching19.nativePlayback, true);
  assert.equal(waitingRoomDiscoveredMusicTrack(feed, { level: "A2", day: 20 }).src, day20.audioUrl);
  assert.equal(waitingRoomDiscoveredMusicTrack(feed, { level: "B1", day: 19 }), null);
  assert.equal(waitingRoomDiscoveredMusicTrack(feed, { level: "A2", day: 18 }), null);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[{...day19,autoDiscovered:false}]},
    { level:"A2",day:19 }), null);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[{...day19,objectKey:"a2/day-19/hoeren.mp3"}]},
    { level:"A2",day:19 }), null);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[{...day19,audioUrl:"https://attacker.invalid/song.mp3"}]},
    { level:"A2",day:19 }), null);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[day19,{...day19,id:"r2-a2-day-19-other",
    title:"Other music",audioUrl:"https://www.falowen.app/api/music?track=r2-a2-day-19-other",
    objectKey:"music/a2/day-19/other.mp3"}]},
    { level:"A2",day:19,assignmentKey:"A2-7.19" }).src, day19.audioUrl);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[day19,{...day19,id:"r2-a2-day-19-other",
    audioUrl:"https://www.falowen.app/api/music?track=r2-a2-day-19-other",
    objectKey:"music/a2/day-19/other.mp3"}]},
    { level:"A2",day:19 }), null);
});

test("attendance uses existing read-only public music API only on teacher Start, via same-origin Vercel rewrite", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const rewrite = config.rewrites.find(entry => entry.source === "/api/attendance-music-library");
  assert.equal(rewrite.destination, "https://www.falowen.app/api/music-library");
  const page = readFileSync(new URL("../src/pages/CheckinDisplayPage.jsx", import.meta.url), "utf8");
  const start = page.indexOf("const startWaitingMusic = useCallback");
  assert.ok(start > page.indexOf("const waitingSessionPlaylist"));
  assert.ok(page.indexOf("fetch(WAITING_ROOM_DISCOVERED_MUSIC_URL", start) > start);
  assert.match(page, /waitingRoomDiscoveredMusicTrack\(data/);
  assert.match(page, /if \(uploadedDay\) \{\s*throw new Error/);
  assert.match(page, /musicSessionRef\.current !== musicSessionKey/);
  assert.doesNotMatch(page.slice(0,start), /fetch\(WAITING_ROOM_DISCOVERED_MUSIC_URL/);
});
