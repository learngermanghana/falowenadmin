import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { mayUseMusicStudio } = require("../functions/musicStudio.js");

const fakeDb = (record) => ({
  collection(name) {
    assert.equal(name, "falowenStaffAccess");
    return {
      doc(uid) {
        assert.equal(uid, "swahili-teacher");
        return { get: async () => ({ exists: Boolean(record), data: () => record }) };
      },
    };
  },
});
const runtimeConfig = { ai_studio: { owner_uid: "owner-account" } };
test("owner remains authorized without querying a staff record", async () => {
  assert.equal(await mayUseMusicStudio(fakeDb(null), { uid: "owner-account" }, "german", runtimeConfig), true);
});
test("staff music access requires a live matched identity and selected language", async () => {
  const record = {
    uid: "swahili-teacher", email: "teacher@example.com", active: true, languages: ["swahili"],
    accessJson: JSON.stringify({ swahili: { music: true }, german: { music: false } }),
  };
  const actor = { uid: "swahili-teacher", email: "teacher@example.com" };
  assert.equal(await mayUseMusicStudio(fakeDb(record), actor, "swahili", runtimeConfig), true);
  assert.equal(await mayUseMusicStudio(fakeDb(record), actor, "german", runtimeConfig), false);
  assert.equal(await mayUseMusicStudio(fakeDb({ ...record, active: false }), actor, "swahili", runtimeConfig), false);
  assert.equal(await mayUseMusicStudio(fakeDb(record), { ...actor, email: "someoneelse@example.com" }, "swahili", runtimeConfig), false);
  assert.equal(await mayUseMusicStudio(fakeDb({ ...record, accessJson: "invalid" }), actor, "swahili", runtimeConfig), false);
  assert.equal(await mayUseMusicStudio(fakeDb(null), actor, "swahili", runtimeConfig), false);
});
