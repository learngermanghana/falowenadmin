import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { canUseMusicStudio, createTimingAccessHandler } = require("../functions/musicStudioAccess.js");
const runtimeConfig = { ai_studio: { owner_uid: "owner" } };
const musicPage = ["music-studio"];
const staff = { uid: "staff", staff: true, staffPages: musicPage, staffLanguages: ["swahili", "german"] };
const dbWithAccess = access => ({ collection: () => ({ doc: () => ({ get: async () => ({ data: () => access }) }) }) });

test("server intersects current permissions and token claims for each language", async () => {
  const db = dbWithAccess({ active: true, pages: musicPage, languages: ["swahili"] });
  assert.equal(await canUseMusicStudio(db, staff, runtimeConfig, "swahili"), true);
  assert.equal(await canUseMusicStudio(db, staff, runtimeConfig, "german"), false);
  assert.equal(await canUseMusicStudio(db, { ...staff, staffLanguages: ["german"] }, runtimeConfig, "swahili"), false);
  assert.equal(await canUseMusicStudio(db, { ...staff, staffPages: [] }, runtimeConfig, "swahili"), false);
  assert.equal(await canUseMusicStudio(dbWithAccess({ active: false }), staff, runtimeConfig, "swahili"), false);
  assert.equal(await canUseMusicStudio({}, { uid: "owner" }, runtimeConfig, "german"), true);
});

test("timing permission endpoint requires a verified token and requested language access", async () => {
  const handler = createTimingAccessHandler({
    db: dbWithAccess({ active: true, pages: musicPage, languages: ["swahili"] }),
    runtimeConfig,
    verifyToken: async token => {
      if (token !== "valid") throw Error("bad token");
      return staff;
    },
  });
  for (const [token, language, expected] of [["bad", "swahili", 401], ["valid", "german", 403], ["valid", "swahili", 200]]) {
    const res = { set() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await handler({ headers: { authorization: "Bearer " + token }, body: { language } }, res);
    assert.equal(res.code, expected);
    assert.equal(res.body.ok, expected === 200);
  }
});

test("music video editor separates German and Swahili song catalogs and sidecars", async () => {
  const { readFileSync } = await import("node:fs");
  const video = readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx", import.meta.url), "utf8");
  assert.match(video, /const assignedLanguage = swahili \? "swahili" : "german"/);
  assert.match(video, /setTracks\(SWAHILI_MUSIC_TRACKS\.filter\(track => allowedMusicKey\(track\.objectKey\)\)\)/);
  assert.match(video, /setTracks\(data\.tracks\.filter\(track=>allowedMusicKey\(track\.objectKey\)/);
  assert.match(video, /const key=allowedMusicKey\(objectKey\) \? audioFilenameObjectKey\(objectKey\) : ""/);
  assert.match(video, /disabled=\{!allowedMusicKey\(objectKey\)/);
  assert.match(video, /normalized\.startsWith\("swahili\/music\/"\)/);
  assert.match(video, /if \(language === "german"\)/);
});

test("every registered Swahili recording passes the studio catalog filter", async () => {
  const { readFileSync } = await import("node:fs");
  const { SWAHILI_MUSIC_TRACKS } = await import("../src/data/swahiliMusicTracks.js");
  const video = readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx", import.meta.url), "utf8");
  const match = video.match(/function audioFilenameObjectKey\(text\) \{[\s\S]*?\n\}/);
  assert.ok(match);
  const validate = new Function("return (" + match[0] + ")")();
  for (const track of SWAHILI_MUSIC_TRACKS) assert.equal(validate(track.objectKey), track.objectKey, track.id);
  for (const id of ["swahili-a1-day-10", "swahili-a1-day-11", "swahili-a1-day-12", "swahili-b1-day-28"]) {
    assert.ok(SWAHILI_MUSIC_TRACKS.some(track => track.id === id), id);
  }
  assert.equal(validate("swahili/music/A1/day-12/not-a-song.exe"), "");
  assert.equal(validate("music/a1/day-12/not-approved.mp3.mpeg"), "");
});
