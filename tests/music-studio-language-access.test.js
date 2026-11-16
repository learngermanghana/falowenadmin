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
